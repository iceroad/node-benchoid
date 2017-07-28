const _ = require('lodash'),
  spawnSync = require('child_process').spawnSync
;

function getClientTier() {
  const rv = spawnSync('terraform output', {
    stdio: 'pipe',
    shell: true,
    cwd: 'terraform',
  });
  if (rv.status !== 0) {
    throw new Error(
      `Cannot run "terraform output": ${rv.stderr.toString('utf-8')}`);
  }
  const lines = _.filter(rv.stdout.toString('utf-8').split('\n'));
  const tier = _.filter(_.map(lines, (lineStr) => {
    const parts = lineStr.match(/^client-tier-ip-\d+\s+=\s+(\S+)/);
    if (parts && parts.length >= 2) {
      return parts[1];
    }
  }));
  if (!tier.length) {
    throw new Error('Cannot find any client IPs in "terraform output"');
  }
  return tier;
}


module.exports = {
  getClientTier,
};
