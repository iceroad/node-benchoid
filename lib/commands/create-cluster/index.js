const _ = require('lodash'),
  chalk = require('chalk'),
  fs = require('fs'),
  fse = require('fs-extra'),
  inquirer = require('inquirer'),
  ssh = require('../../util/ssh'),
  path = require('path'),
  genTerraform = require('./genTerraform'),
  spawnSync = require('child_process').spawnSync,
  walkthrough = require('./walkthrough')
  ;

function CreateClusterCmd() {
  const configPath = path.resolve('terraform', 'cluster.json');
  fse.ensureDirSync(path.dirname(configPath));

  //
  // Read existing cluster.json if it exists.
  //
  const clusterConfig = {};
  try {
    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    _.extend(clusterConfig, JSON.parse(rawConfig));
    console.debug('Read cluster configuration from cluster.json');
  } catch (e) {
    console.warn('No cluster.json found, creating new cluster...');
  }

  //
  // Locate user's system-default public key if one is not specified.
  //
  if (!clusterConfig.sshPubKey) {
    try {
      const pubKey = ssh.getUserSSHPublicKey();
      clusterConfig.sshPubKey = pubKey.pubKeyRaw;
      console.log(`Read SSH public key from ${pubKey.pubKeyLocation}`);
    } catch (e) {
      console.error(e);
      return process.exit(1);
    }
  }

  //
  // Go through interactive prompts.
  //
  walkthrough(clusterConfig).then((answers) => {
    _.extend(clusterConfig, answers);

    // Write cluster.json
    fs.writeFileSync(configPath, JSON.stringify(clusterConfig, null, 2), 'utf-8');
    console.log(`Wrote master configuration to ${clusterConfig}`);

    // Create Terraform directory and write Terraform file.
    const outPath = path.join('terraform', 'cluster.tf');

    fs.writeFileSync(outPath, genTerraform(clusterConfig), 'utf-8');
    console.log(`Wrote Terraform to ${outPath}`);

    // Run "terraform plan" in the "terraform" directory.
    const rv = spawnSync('terraform plan', {
      cwd: path.resolve('terraform'),
      shell: true,
      stdio: 'inherit',
    });
    if (rv.status) {
      console.error('"terraform plan" exited with non-zero return code, aborting.');
      return process.exit(1);
    }

    inquirer.prompt([
      {
        type: 'confirm',
        name: 'runApply',
        message: 'Run "terraform apply"?',
        default: false,
      },
    ]).then((answers) => {
      if (!answers.runApply) {
        return process.exit(1);
      }

      console.info(`Running ${chalk.bold('terraform apply')} in terraform/...`);
      const rv = spawnSync('terraform apply', {
        cwd: path.resolve('terraform'),
        shell: true,
        stdio: 'inherit',
      });
      console.info(`${chalk.bold('terraform apply')} exited with code ${rv.status}`);

      if (rv.status) {
        console.error(`${chalk.bold('terraform apply')} failed`);
        return process.exit(1);
      }

      console.info(`${chalk.green('Cluster is ready.')}`);
      return process.exit(0);
    });
  });
}

module.exports = CreateClusterCmd;
