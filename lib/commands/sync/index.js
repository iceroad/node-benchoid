const _ = require('lodash'),
  async = require('async'),
  path = require('path'),
  ssh = require('../../util/ssh'),
  terraform = require('../../util/terraform')
  ;

function SyncCmd() {
  const clientTier = terraform.getClientTier();
  const agentDir = path.resolve('agent');
  const driverDir = path.resolve(__dirname, '../../driver');
  const runners = _.map(clientTier, clientIp => cb => async.series([
    cb => ssh.rsync(clientIp, agentDir, '', cb),
    cb => ssh.rsync(clientIp, driverDir, '', cb),
    cb => ssh.remoteExec(clientIp, 'cd agent && npm install', cb),
    cb => ssh.remoteExec(clientIp, 'cd driver && npm install', cb),
  ], cb));
  async.parallel(runners, (err) => {
    if (err) console.error(err);
    return process.exit(err ? 1 : 0);
  });
}

module.exports = SyncCmd;
