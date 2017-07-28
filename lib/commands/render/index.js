const _ = require('lodash'),
  assert = require('assert'),
  fs = require('fs'),
  fse = require('fs-extra'),
  json = JSON.stringify,
  path = require('path'),
  pug = require('pug')
  ;

function RenderCmd(args) {
  //
  // Read experiment run data and its analysis.
  //
  assert(args.runName, 'Please specify --runName');
  const dataDir = path.resolve('run_data', args.runName);
  const distDir = path.join(dataDir, 'dist');
  const analysis = require(path.join(dataDir, 'analysis.json'));
  const expConfig = require(path.join(dataDir, 'experiment-config.json'));
  const extVariables = require(path.join(dataDir, 'external-variables.json'));
  const rawDataStat = fs.statSync(path.join(dataDir, 'data.txt'));
  const locals = {
    analysis,
    expConfig,
    extVariables,
    rawDataStat,
  };

  //
  // Load page templates from 'analysis' directory.
  //
  const templList = _.filter(fs.readdirSync('render'), fname => fname.match(/\.pug$/i));
  if (!templList.length) {
    console.error('Project has no Pug templates in the "render" directory.');
    return process.exit(1);
  }
  console.log(`Found ${templList.length} Pug template(s) in "render"`);

  //
  // Render each page.
  //
  fse.ensureDirSync(distDir);
  _.forEach(templList, (pugTemplPath) => {
    const templBasename = path.basename(pugTemplPath, '.pug');
    const outputPath = path.join(distDir, `${templBasename}.html`);

    console.log(`Rendering ${pugTemplPath} to ${outputPath}...`);
    const templAbsPath = path.resolve('render', pugTemplPath);
    const outputHtml = pug.compileFile(templAbsPath, {
      file: templAbsPath,
      basedir: process.cwd(),
    })(locals);

    fs.writeFileSync(outputPath, outputHtml, 'utf-8');
    console.log(`Wrote ${outputPath}.`);
  });

  //
  // Copy assets
  //
  const assetsSrcPath = path.resolve('render', 'assets');
  if (fs.existsSync(assetsSrcPath)) {
    const assetsOutPath = path.join(distDir, 'assets');
    fse.copySync(assetsSrcPath, assetsOutPath);
    console.log(`Copied "${assetsSrcPath}" to "${assetsOutPath}"`);
  }

  //
  // Write analysis data as a Javascript global in the dist directory.
  //
  const dataFileOut = path.join(distDir, 'data.js');
  const dataFileStr = `var DATA = ${json(analysis, null, 2)};`;
  fs.writeFileSync(dataFileOut, dataFileStr, 'utf-8');
  console.log(`Wrote "${dataFileOut}"`);

  console.log('Render complete.');
}

module.exports = RenderCmd;
