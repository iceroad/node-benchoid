const _ = require('lodash')
const col = require('chalk')
const command = require('commander')
const fs = require('fs')
const fse = require('fs-extra')
const json = x => JSON.stringify(x, null, 2)
const inquirer = require('inquirer')
const ssh = require('../../util/ssh')
const path = require('path')
const genTerraform = require('./genTerraform')
const spawnSync = require('child_process').spawnSync
const walkthrough = require('./walkthrough')


function CreateClusterCmd(args) { 
  command
    .description('Create a new EC2 test cluster using Terraform.')    
    .option('-n, --name <namePrefix>', 'Cluster name prefix', 'benchoid-test-cluster')
    .option('-i, --instances <clients>', 'EC2 instances in client tier', 3)
    .option('-t, --instanceType <instanceType>', 'EC2 instance type', 't2.small')
    .option('-r, --region <regionName>', 'Region to create EC2 instances in', 'us-west-2')
    .option('-p, --pubKeyPath <publicKey>', 'Path to SSH public key', ssh.getUserSSHPublicKeyLocation())
    .option('--amiOwnerAccount <accountId>', 'AWS account that offers AMI (default: Canonical)', '099720109477')
    .option('--amiSearchTerm <searchStr>', 'AMI search term', 'ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-amd64-server-*')

    .parse([...process.argv.slice(0, 2), ...args])

  // Get public SSH key to embed into instance's authorized_keys.
  command.sshPubKey = ssh.getUserSSHPublicKey(command.pubKeyPath)
  console.log(col.green(`Got SSH public key: ${col.dim(command.sshPubKey)}`))

  // Ensure cluster state directory exists.
  const stateDir = path.resolve('benchoid_state', 'clusters', command.name)
  fse.ensureDirSync(stateDir)

  // Generate Terraform source.
  const tfSource = genTerraform(command)
  const tfSourcePath = path.join(stateDir, 'cluster.tf')
  fs.writeFileSync(tfSourcePath, tfSource, 'utf-8')
  console.log(`Wrote Terraform source to ${tfSourcePath}`)

  // Run "terraform apply" in the cluster state directory.
  console.log(col.green('Running "terraform apply"...'))
  const rv = spawnSync('terraform apply', {
    cwd: stateDir,
    shell: true,
    stdio: 'inherit',
  })
  if (rv.status) {
    return Promise.reject(new Error(
      `"terraform apply" exited with code ${rv.status}, aborting.`))
  }
  
  return Promise.resolve()/*


  //
  // Read existing cluster.json if it exists.
  //
  const clusterConfig = {}
  try {
    const rawConfig = fs.readFileSync(configPath, 'utf-8')
    _.extend(clusterConfig, JSON.parse(rawConfig))
    console.debug('Read cluster configuration from cluster.json')
  } catch (e) {
    console.warn('No cluster.json found, creating new cluster...')
  }


  //
  // Go through interactive prompts.
  //
  walkthrough(clusterConfig).then(answers => {
    _.extend(clusterConfig, answers)

    // Write cluster.json
    fs.writeFileSync(configPath, JSON.stringify(clusterConfig, null, 2), 'utf-8')
    console.log(`Wrote master configuration to ${clusterConfig}`)

    // Create Terraform directory and write Terraform file.
    const outPath = path.join('terraform', 'cluster.tf')

    fs.writeFileSync(outPath, genTerraform(clusterConfig), 'utf-8')
    console.log(`Wrote Terraform to ${outPath}`)

    // Run "terraform plan" in the "terraform" directory.
    const rv = spawnSync('terraform plan', {
      cwd: path.resolve('terraform'),
      shell: true,
      stdio: 'inherit',
    })
    if (rv.status) {
      console.error('"terraform plan" exited with non-zero return code, aborting.')
      return process.exit(1)
    }

    inquirer.prompt([
      {
        type: 'confirm',
        name: 'runApply',
        message: 'Run "terraform apply"?',
        default: false,
      },
    ]).then(answers => {
      if (!answers.runApply) {
        return process.exit(1)
      }

      console.info(`Running ${chalk.bold('terraform apply')} in terraform/...`)
      const rv = spawnSync('terraform apply', {
        cwd: path.resolve('terraform'),
        shell: true,
        stdio: 'inherit',
      })
      console.info(`${chalk.bold('terraform apply')} exited with code ${rv.status}`)

      if (rv.status) {
        console.error(`${chalk.bold('terraform apply')} failed`)
        return process.exit(1)
      }

      console.info(`${chalk.green('Cluster is ready.')}`)
      return process.exit(0)
    })
  }) */
}

module.exports = CreateClusterCmd
