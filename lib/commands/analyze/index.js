const _ = require('lodash'),
  assert = require('assert'),
  async = require('async'),
  col = require('../../util/colutil'),
  fs = require('fs'),
  fse = require('fs-extra'),
  json = JSON.stringify,
  readline = require('readline'),
  path = require('path')
  ;

function AnalyzeCmd(args) {
  assert(args.runName, 'Please specify --runName');

  console.log(col.starting(`Analyzing run "${col.bold(args.runName)}"`));
  const analysisModules = require(path.resolve('analysis'));
  const dataDir = path.resolve('run_data', args.runName);
  const extVariables = require(path.join(dataDir, 'external-variables.json'));
  const expConfig = require(path.join(dataDir, 'experiment-config.json'));

  return async.auto({
    // Read raw run data.
    rows: (cb) => {
      const dataPath = path.join(dataDir, 'data.txt');
      console.log(col.status(`Reading ${dataPath}...`));
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
        console.log(col.status(`Sorting ${rows.length} rows by time...`));
        return cb(null, _.orderBy(rows, 'time'));
      });
    },

    // Run raw data through all the analysis modules.
    analysis: ['rows', (deps, cb) => {
      const rows = deps.rows;
      const analysis = _.mapValues(analysisModules, (reduceFn, analysisName) => {
        console.log(col.status(`Running analysis "${analysisName}"...`));
        return reduceFn(rows, extVariables, expConfig);
      });

      // Write analysis output as JSON for Pug templates.
      const analysisJsonOutputPath = path.join(dataDir, 'analysis.json');
      fse.ensureDirSync(path.dirname(analysisJsonOutputPath));
      fs.writeFileSync(analysisJsonOutputPath, json(analysis, null, 2));
      console.log(col.status(`Wrote analysis output as JSON to "${analysisJsonOutputPath}"`));

      // Write analysis output as inline Javascript for client-side plots.
      const analysisJsOutputPath = path.join(dataDir, 'analysis.js');
      const dataFileStr = `var DATA = ${json(analysis, null, 2)};\n`;
      fse.ensureDirSync(path.dirname(analysisJsOutputPath));
      fs.writeFileSync(analysisJsOutputPath, dataFileStr, 'utf-8');
      console.log(col.status(`Wrote analysis output as JS to "${analysisJsOutputPath}"`));

      return cb(null, analysis);
    }],

    // Generate a composite JSON file for template rendering.
    composite: ['analysis', (deps, cb) => {
      const composite = {
        analysis: deps.analysis,
        extVariables,
        expConfig,
      };

      // Write composite data as JSON
      const compJsonOutputPath = path.join(dataDir, 'composite.json');
      fse.ensureDirSync(path.dirname(compJsonOutputPath));
      fs.writeFileSync(compJsonOutputPath, json(composite, null, 2));
      console.log(col.status(`Wrote composite data output to "${compJsonOutputPath}"`));
      return cb(null, composite);
    }],
  }, (err) => {
    if (err) {
      console.error(err.message);
      return process.exit(1);
    }
    console.log(col.success('Analysis done.'));
    return process.exit(0);
  });
}

module.exports = AnalyzeCmd;
