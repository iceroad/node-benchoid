const _ = require('lodash'),
  assert = require('assert'),
  async = require('async'),
  fs = require('fs'),
  fse = require('fs-extra'),
  json = JSON.stringify,
  readline = require('readline'),
  path = require('path')
  ;

function AnalyzeCmd(args) {
  assert(args.runName, 'Please specify --runName');
  const analysisModules = require(path.resolve('analysis'));
  const dataDir = path.resolve('run_data', args.runName);
  const extVar = require(path.join(dataDir, 'external-variables.json'));
  const expConfig = require(path.join(dataDir, 'experiment-config.json'));

  return async.auto({
    rows: (cb) => {
      const dataPath = path.join(dataDir, 'data.txt');
      console.log(`Reading ${dataPath}...`);
      const dataStream = fs.createReadStream(dataPath);
      const rl = readline.createInterface({
        input: dataStream,
      });
      const rows = [];
      let linesIn = 0;
      rl.on('line', (lineStr) => {
        linesIn++;
        try {
          const obj = JSON.parse(lineStr);
          assert(obj.time, `Row ${linesIn} has no "time" attribute.`);
          rows.push(obj);
        } catch (e) {
          console.error(`Line ${linesIn} is not a valid JSON object.`);
        }
      });
      rl.on('close', () => {
        console.log(`Sorting ${rows.length} rows by time...`);
        return cb(null, _.orderBy(rows, 'time'));
      });
    },

    analysis: ['rows', (deps, cb) => {
      const rows = deps.rows;
      const results = _.mapValues(analysisModules, (reduceFn, analysisName) => {
        console.log(`Running analysis "${analysisName}"...`);
        return reduceFn(rows, extVar, expConfig);
      });

      const resultsOutputPath = path.join(dataDir, 'analysis.json');
      fse.ensureDirSync(path.dirname(resultsOutputPath));
      fs.writeFileSync(resultsOutputPath, json(results, null, 2));
      console.log(`Wrote analysis output to "${resultsOutputPath}"`);
      return cb(null, results);
    }],
  }, (err) => {
    if (err) {
      console.error(err.message);
      return process.exit(1);
    }
    console.log('Analysis phase done.');
    return process.exit(0);
  });
}

module.exports = AnalyzeCmd;
