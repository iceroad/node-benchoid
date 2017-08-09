const chalk = require('chalk'),
  path = require('path'),
  spawnSync = require('child_process').spawnSync
  ;


function teardownCluster() {
  console.info(`Running ${chalk.bold('terraform destroy')} in terraform/...`);
  const rv = spawnSync('terraform destroy', {
    cwd: path.resolve('terraform'),
    shell: true,
    stdio: 'inherit',
  });
  console.info(`${chalk.bold('terraform destroy')} exited with code ${rv.status}`);
}


module.exports = teardownCluster;
