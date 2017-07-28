const col = require('chalk'),
  os = require('os'),
  pkgVer = require('../../package.json').version,
  spawnSync = require('child_process').spawnSync
  ;


function version(pkgName) {
  let latestVer = '';

  try {
    latestVer = spawnSync(`npm show ${pkgName} version`, {
      shell: true,
      stdio: 'pipe',
    }).stdout.toString('utf-8').replace(/\s/gm, '');
  } catch (e) { }

  const osType = os.type();
  const sudo = (osType === 'Linux' || osType === 'Darwin') ? 'sudo ' : '';

  let latestVerStr = '';
  if (latestVer) {
    if (latestVer !== pkgVer) {
      latestVerStr = ` latest npm version: ${col.green(latestVer)}
Run "${col.green(col.bold(`${sudo}npm install -g ${pkgName}@latest`))}" to upgrade.`;
    } else {
      latestVerStr = ` (${col.green('up-to-date!')})`;
    }
  }

  return `${pkgVer}${latestVerStr}`;
}


module.exports = version;
