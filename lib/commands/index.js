module.exports = {
  get 'create-cluster'() {
    return require('./create-cluster')
  },
  get 'destroy-cluster'() {
    return require('./destroy-cluster')
  },
  get status() {
    return require('./status')
  },
  get version() {
    return require('./status')
  },
}


/*

function GetMostRecentRun() {
  return _.first(getRunDataIndex());
}

const J = {
  'create-cluster': {
    name: 'create-cluster',
    desc: '',
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
    argSpec: [
      {
        flags: ['cmd'],
        desc: 'Command to execute in remote shell on all instances',
      },
    ],
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
        default: _.get(GetMostRecentRun(), 'name'),
      },
      {
        flags: ['all'],
        desc: 'Run "analyze" for all runs in run_data.',
      },
    ],
  },
};
*/
