const _ = require('lodash'),
  async = require('async'),
  chalk = require('chalk'),
  fs = require('fs'),
  os = require('os'),
  path = require('path'),
  readline = require('readline'),
  spawn = require('child_process').spawn
  ;


function getUserSSHPublicKey() {
  const pubKeyLocation = path.join(os.userInfo().homedir, '.ssh', 'id_rsa.pub');
  try {
    const pubKeyRaw = fs.readFileSync(pubKeyLocation, 'utf-8')
      .replace(/[\r\n]/mg, '')
      .trim();
    return { pubKeyRaw, pubKeyLocation };
  } catch (e) {
    throw new Error(
      `No SSH public key found at location: ${pubKeyLocation}: ${e.message}`);
  }
}

function parallelShell(remoteIps, shellInput) {
  const runners = _.map(remoteIps, remoteIp => (cb) => {
    const cmdLine = `ssh -C -o StrictHostKeyChecking=no ubuntu@${remoteIp} "bash -ex"`;
    console.log(chalk.green(`spawn: ${cmdLine}`));
    const child = spawn(cmdLine, {
      shell: true,
      stdio: 'pipe',
    });
    child.once('exit', (code, signal) => {
      console.log(chalk.bold(
        `ssh: lost connection to ${remoteIp}, code=${code}, signal=${signal}`));
      return cb();
    });
    child.once('error', err => cb(err));

    const rl = readline.createInterface({ input: child.stdout });
    rl.on('line', line => console.log(chalk.gray(`stdout:${remoteIp}: ${line}`)));
    const rlErr = readline.createInterface({ input: child.stderr });
    rlErr.on('line', line => console.log(chalk.red(`stderr:${remoteIp}: ${line}`)));

    child.stdin.write(`${shellInput}\nexit 0\n`);
  });
  async.parallel(runners, (err) => {
    if (err) console.error(err);
    return process.exit(err ? 1 : 0);
  });
}

function exec(cmdLine, label, cb) {
  console.log(chalk.green(`spawn: ${cmdLine}`));
  const child = spawn(cmdLine, {
    shell: true,
    stdio: 'pipe',
  });
  child.once('exit', (code, signal) => {
    return cb((code || signal)
      ? new Error(`Local child died with code=${code}, signal=${signal}`)
      : null);
  });
  child.once('error', err => cb(err));
  const rl = readline.createInterface({ input: child.stdout });
  rl.on('line', line => console.log(`O:${label}: ${line}`));
  const rlErr = readline.createInterface({ input: child.stderr });
  rlErr.on('line', line => console.log(`E:${label}: ${line}`));
}

function rsync(remoteIp, localPath, remotePath, cb) {
  const cmdLine = (
    'rsync -arvce "ssh -o StrictHostKeyChecking=no" --delete --exclude node_modules ' +
      `${localPath} ubuntu@${remoteIp}:${remotePath}`);
  exec(cmdLine, remoteIp, (err) => {
    if (err) {
      console.log(chalk.red(`rsync: error syncing to ${remoteIp}, error=${err}`));
    } else {
      console.log(chalk.green(`rsync: "${localPath}" -> "${remotePath}"`));
    }
    return cb();
  });
}

function remoteExec(remoteIp, cmdLine, cb) {
  const sshCmdLine = `ssh -C -o StrictHostKeyChecking=no ubuntu@${remoteIp} ${JSON.stringify(cmdLine)}`;
  exec(sshCmdLine, remoteIp, cb);
}

module.exports = {
  getUserSSHPublicKey,
  exec,
  parallelShell,
  remoteExec,
  rsync,
};
