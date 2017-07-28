const _ = require('lodash'),
  fs = require('fs'),
  ssh = require('../../util/ssh'),
  terraform = require('../../util/terraform')
  ;

function SetupClusterCmd() {
  const clientTier = terraform.getClientTier();
  const setupScript = fs.readFileSync('setup.sh', 'utf-8');
  ssh.parallelShell(clientTier, setupScript);
}

module.exports = SetupClusterCmd;
