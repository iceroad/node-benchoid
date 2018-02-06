const _ = require('lodash')
const async = require('async')
const chalk = require('chalk')
const fs = require('fs')
const os = require('os')
const path = require('path')
const readline = require('readline')
const shellSync = require('./exec').shellSync
const spawn = require('child_process').spawn

function getUserSSHPublicKeyLocation() {
  return path.join(os.userInfo().homedir, '.ssh', 'id_rsa.pub')
}

function getUserSSHPublicKey() {
  const pubKeyLocation = getUserSSHPublicKeyLocation()
  try {
    return fs.readFileSync(pubKeyLocation, 'utf-8')
      .replace(/[\r\n]/mg, '')
      .trim()
  } catch (e) {
    throw new Error(`No SSH public key found at location: ${pubKeyLocation}: ${e.message}`)
  }
}

function parallelShell(remoteIps, shellInput) {
  const runners = _.map(remoteIps, remoteIp => cb => {
    const cmdLine = `ssh -C -o StrictHostKeyChecking=no ubuntu@${remoteIp} "bash -ex"`
    console.log(chalk.green(`spawn: ${cmdLine}`))
    const child = spawn(cmdLine, {
      shell: true,
      stdio: 'pipe',
    })
    child.once('exit', (code, signal) => {
      console.log(chalk.bold(`ssh: lost connection to ${remoteIp}, code=${code}, signal=${signal}`))
      return cb()
    })
    child.once('error', err => cb(err))

    const rl = readline.createInterface({ input: child.stdout })
    rl.on('line', line => console.log(chalk.gray(`stdout:${remoteIp}: ${line}`)))
    const rlErr = readline.createInterface({ input: child.stderr })
    rlErr.on('line', line => console.log(chalk.red(`stderr:${remoteIp}: ${line}`)))

    child.stdin.write(`\
ulimit -n 32768
${shellInput}
exit 0
`)
  })
  async.parallel(runners, err => {
    if (err) console.error(err)
    return process.exit(err ? 1 : 0)
  })
}

function exec(cmdLine, label, cb) {
  console.log(chalk.green(`spawn: ${cmdLine}`))
  const child = spawn(cmdLine, {
    shell: true,
    stdio: 'pipe',
  })
  child.once('exit', (code, signal) => cb((code || signal)
    ? new Error(`Local child died with code=${code}, signal=${signal}`)
    : null))
  child.once('error', err => cb(err))
  const rl = readline.createInterface({ input: child.stdout })
  rl.on('line', line => console.log(`O:${label}: ${line}`))
  const rlErr = readline.createInterface({ input: child.stderr })
  rlErr.on('line', line => console.log(`E:${label}: ${line}`))
}

function rsync(remoteIp, localPath, remotePath, cb) {
  const cmdLine = (
    'rsync -arvce "ssh -o StrictHostKeyChecking=no" --delete --exclude node_modules ' +
      `${localPath} ubuntu@${remoteIp}:${remotePath}`)
  exec(cmdLine, remoteIp, err => {
    if (err) {
      console.log(chalk.red(`rsync: error syncing to ${remoteIp}, error=${err}`))
    } else {
      console.log(chalk.green(`rsync: "${localPath}" -> "${remotePath}"`))
    }
    return cb()
  })
}

function remoteExec(remoteIp, cmdLine, cb) {
  const sshCmdLine = `ssh -C -o StrictHostKeyChecking=no ubuntu@${remoteIp} ${JSON.stringify(cmdLine)}`
  exec(sshCmdLine, remoteIp, cb)
}

function getRsyncVersionSync() {
  return shellSync('rsync --version').match(/rsync\s+version\s+(\S+)/mi)[1]
}

function getSshVersionSync() {
  return shellSync('ssh -V').split(' ')[0]
}


module.exports = {
  getRsyncVersionSync,
  getSshVersionSync,  
  getUserSSHPublicKey,
  getUserSSHPublicKeyLocation,
  exec,
  parallelShell,
  remoteExec,
  rsync,
}
