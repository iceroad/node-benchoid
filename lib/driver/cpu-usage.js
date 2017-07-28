const _ = require('lodash'),
  os = require('os')
;

const MIN_SNAPSHOT_LIFETIME = 5000; // Average over 5 second windows.

const LAST_CPU_SNAPSHOT = _.map(os.cpus(), (coreInfo) => {
  return {
    times: _.mapValues(coreInfo.times, () => 0),
  };
});

let LAST_SNAPSHOT_TIME;

function cpuUsage() {
  const current = os.cpus();
  const timeDiffs = {};

  _.forEach(current, (coreInfo, coreIdx) => {
    _.forEach(coreInfo.times, (curVal, timeType) => {
      const lastVal = LAST_CPU_SNAPSHOT[coreIdx].times[timeType];
      if (lastVal) {
        timeDiffs[timeType] = timeDiffs[timeType] || 0;
        timeDiffs[timeType] += curVal - lastVal;
      }
    });
  });

  const sumTimes = _.sum(_.values(timeDiffs));
  const timeDiffPcnts = _.mapValues(timeDiffs, t => t / sumTimes);

  LAST_SNAPSHOT_TIME = LAST_SNAPSHOT_TIME || Date.now();
  if (Date.now() - LAST_SNAPSHOT_TIME > MIN_SNAPSHOT_LIFETIME) {
    _.merge(LAST_CPU_SNAPSHOT, current);
  }

  return 1.0 - timeDiffPcnts.idle;
}

module.exports = cpuUsage;
