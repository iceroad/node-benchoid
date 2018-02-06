const spawnSync = require('child_process').spawnSync

function shellSync(cmdLine) {
  const rv = spawnSync(cmdLine, {
    shell: true,
    stdio: 'pipe',
  })
  if (rv.status) {
    throw new Error(`Shell command "${cmdLine}" exited with code ${rv.status}.
Standard error:
---------------------
${rv.stderr.toString()}
---------------------`)
  }

  let retStr = rv.stdout.toString('utf-8')
  if (!retStr && rv.stderr) {
    retStr = rv.stderr.toString('utf-8')
  }

  return retStr
}

function shell(cmdLine) {
  return Promise((resolve, reject) => {
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
  })
}

module.exports = {
  shellSync,
  shell,
}
