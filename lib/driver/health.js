const _ = require('lodash'),
  cpuUsage = require('./cpu-usage'),
  os = require('os')
;

function health(children) {
  console.log(JSON.stringify({
    event: 'health',
    host: os.hostname(),
    pid: process.pid,
    time: Date.now(),
    data: {
      agents: _.size(children),
      cpuUsage: cpuUsage(),
      memUsage: 1.0 - (os.freemem() / os.totalmem()),
    },
  }));

  setTimeout(() => health(children), 5000);
}

module.exports = health;
