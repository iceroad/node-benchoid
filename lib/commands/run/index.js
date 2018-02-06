const _ = require('lodash'),
  async = require('async'),
  assert = require('assert'),
  chalk = require('chalk'),
  fs = require('fs'),
  fse = require('fs-extra'),
  json = JSON.stringify,
  path = require('path'),
  readline = require('readline'),
  spawn = require('child_process').spawn,
  terraform = require('../../util/terraform'),
  walkthrough = require('./walkthrough')

function run(args) {
  //
  // Get cluster state
  //
  let clientTier
  try {
    clientTier = terraform.getClientTier()
  } catch (e) {
    console.error(`Cannot get Terraform state: ${e.message}`)
    return process.exit(1)
  }

  walkthrough(args).then(expConfig => {
    //
    // Create run data directory.
    //
    const dataDir = path.join('run_data', expConfig.runName)
    fse.ensureDirSync(dataDir)
    console.log(`benchoid: run data directory is "${dataDir}"`)

    //
    // Write cluster and experiment configs.
    //
    const outPath = path.join(dataDir, 'experiment-config.json')
    fs.writeFileSync(outPath, json(expConfig, null, 2), 'utf-8')
    console.log(`benchoid: wrote experiment configuration to "${outPath}"`)

    //
    // Read external variables script and export it as JSON
    //
    const extVars = require(path.resolve('external-variables.js'))
    const extVarsOut = path.join(dataDir, 'external-variables.json')
    fs.writeFileSync(extVarsOut, json(extVars, null, 2), 'utf-8')
    console.log(`benchoid: wrote external variables to  "${extVarsOut}"`)

    //
    // Create file write stream for incoming event data.
    //
    const dataOutPath = path.join(dataDir, 'data.txt')
    const dataOutStream = fs.createWriteStream(dataOutPath)
    let rowsWritten = 0,
      bytesWritten = 0

    //
    // Parallel execute drivers.
    //
    const runners = _.map(clientTier, remoteIp => cb => {
      const cmdLine = json(`\
ulimit -n 32768 && \
NODE_ENV=production node --max_old_space_size=8192 driver \
--numAgents ${expConfig.numAgents} \
--warmup ${expConfig.warmup} \
--steady ${expConfig.steady}`)
      const sshCmdLine = `ssh -C -o StrictHostKeyChecking=no ubuntu@${remoteIp} ${cmdLine}`

      console.log(chalk.green(sshCmdLine))
      const child = spawn(sshCmdLine, {
        shell: true,
        stdio: ['pipe', 'pipe', 'inherit'],
      })
      child.once('exit', (code, signal) => {
        if (code || signal) {
          return cb(new Error(`benchoid: local child for ${remoteIp} died with code=${code}, signal={$signal}.`))
        }
        return cb()
      })
      child.once('error', err => cb(err))

      const rlIn = readline.createInterface({ input: child.stdout })
      rlIn.on('line', lineStr => {
        try {
          assert(_.isObject(JSON.parse(lineStr)))
          dataOutStream.write(lineStr)
          dataOutStream.write('\n')
          bytesWritten += lineStr.length + 1
          rowsWritten++
        } catch (e) {
          console.warn('Bad line from remote driver.')
        }

        if (rowsWritten % 100 === 0) {
          console.log(`benchoid: ${rowsWritten} data rows received (${bytesWritten} bytes).`)
        }
      })
    })
    async.parallel(runners, err => {
      if (err) console.error(err)
      return process.exit(err ? 1 : 0)
    })
  })
}

module.exports = run
