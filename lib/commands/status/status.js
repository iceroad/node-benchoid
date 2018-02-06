const pkgVer = require('../../../package.json').version
const ssh = require('../../util/ssh')
const terraform = require('../../util/terraform')

function StatusCLICommand() {
  console.log(`benchoid:  ${pkgVer}`)  
  console.log(`ssh:       ${ssh.getSshVersionSync()}`)
  console.log(`rsync:     ${ssh.getRsyncVersionSync()}`)  
  console.log(`terraform: ${terraform.getVersionSync()}`)
  console.log(`node:      ${process.versions.node}`)
  return Promise.resolve()
}

module.exports = StatusCLICommand
