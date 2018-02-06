const _ = require('lodash'),
  fs = require('fs'),
  path = require('path')

function getRunDataIndex() {
  try {
    const runs = _.filter(_.map(fs.readdirSync('run_data'), name => ({
      name,
      stat: fs.statSync(path.resolve('run_data', name)),
    })))
    return _.orderBy(runs, run => -run.stat.mtime.getTime())
  } catch (e) {
    console.debug(`Cannot read run_data directory: ${e.message}`)
  }
}

module.exports = getRunDataIndex
