const ssh = require('../../util/ssh'),
  terraform = require('../../util/terraform')
;

function ClusterExecCmd(args) {
  if (!args.cmd) {
    console.error('Please specify --cmd');
    return process.exit(1);
  }
  const clientTier = terraform.getClientTier();
  ssh.parallelShell(clientTier, `${args.cmd}\n`);
}

module.exports = ClusterExecCmd;
