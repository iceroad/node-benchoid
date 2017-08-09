const _ = require('lodash'),
  col = require('../util/colutil'),
  fs = require('fs'),
  path = require('path')
  ;

function GetMostRecentRun() {
  try {
    const runs = _.filter(_.map(fs.readdirSync('run_data'), name => {
      return {
        name,
        stat: fs.statSync(path.resolve('run_data', name)),
      };
    }));
    const mostRecent = _.first(_.orderBy(runs, run => -run.stat.mtime.getTime()));
    return mostRecent.name;
  } catch (e) { }
}

module.exports = {
  'create-cluster': {
    name: 'create-cluster',
    desc: 'Create a new test cluster using Terraform.',
    helpPriority: 1,
    helpGroup: 'Cluster Management',
  },

  'setup-cluster': {
    name: 'setup-cluster',
    desc: 'Execute setup.sh in the current directory on all instances in parallel.',
    helpPriority: 2,
    helpGroup: 'Cluster Management',
  },

  'teardown-cluster': {
    name: 'teardown-cluster',
    desc: 'Run "terraform destroy" to destroy the test cluster.',
    helpPriority: 3,
    helpGroup: 'Cluster Management',
  },

  sync: {
    name: 'sync',
    desc: 'Synchronize test agent source code to the test cluster (using parallel rsync).',
    helpPriority: 100,
    helpGroup: 'Experiment Control',
  },

  run: {
    name: 'run',
    desc: 'Interactively configure and run a new experiment on the test cluster using the sync\'d agent.',
    helpPriority: 110,
    helpGroup: 'Experiment Control',
  },

  'cluster-exec': {
    name: 'cluster-exec',
    desc: 'Run an arbitrary command on all machines in the cluster in parallel (like Ansible).',
    helpPriority: 120,
    helpGroup: 'Experiment Control',
  },

  analyze: {
    name: 'analyze',
    desc: 'Run analysis scripts on raw data in the run_data directory.',
    helpPriority: 200,
    helpGroup: 'Data Analysis',
    argSpec: [
      {
        flags: ['runName'],
        desc: 'Run to analyze (subdirectory name within run_data)',
        default: GetMostRecentRun(),
      },
    ]
  },
};
