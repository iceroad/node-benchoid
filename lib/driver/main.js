#!/usr/bin/env node
const _ = require('lodash'),
  assert = require('assert'),
  crypto = require('crypto'),
  json = JSON.stringify,
  health = require('./health'),
  minimist = require('minimist'),
  path = require('path'),
  os = require('os'),
  readline = require('readline'),
  spawn = require('child_process').spawn
  ;

function augmentObject(evtObj, agentId) {
  assert(_.isObject(evtObj));
  evtObj.time = Date.now();
  evtObj.agentId = agentId;
  evtObj.hostname = os.hostname();
  return evtObj;
}


function main(args) {
  const agentDir = path.resolve(args.agentDir || 'agent');
  const warmupTime = args.warmup || 30 * 1000; // 30 seconds
  const steadyTime = args.steady || 5 * 60 * 1000; // 5 minutes
  const numAgents = args.numAgents || 10;
  const pid = `${os.hostname()}:${process.pid}`;
  const counts = {
    excludedLines: 0,
  };

  assert(numAgents, 'numAgents must >= 1');
  assert(warmupTime >= 5 * 1000, 'warmup time must be >= 5 seconds (5,000 millis)');
  assert(steadyTime >= 10 * 1000, 'steady time must be >= 10 seconds (10,000 millis');

  const agentSpawnInterval = Math.ceil(warmupTime / numAgents);
  const agentLifetime = Math.ceil(warmupTime + steadyTime);

  console.error(`\
${pid}: experiment config:
numAgents=${numAgents}
warmupTime=${warmupTime}
steadyTime=${steadyTime}
agentLifetime=${agentLifetime}
agentSpawnInterval=${agentSpawnInterval}`);

  //
  // Spawn 'numAgents' processes in 'warmupTime' milliseconds. Run each agent
  // for 'steadyTime' milliseconds. Exit when all agents are dead.
  //
  const children = {};
  _.forEach(_.range(0, numAgents), (idx) => {
    const spawnOffset = (idx * agentSpawnInterval) + _.random(100);
    _.delay(() => {
      //
      // Create the agent process after a delay.
      //
      const agentId = crypto.randomBytes(6).toString('hex');
      console.error(`${pid}: spawning agent ${idx} (${agentId})`);
      const child = spawn(process.execPath, ['.'], {
        cwd: agentDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'inherit'],
      });
      children[agentId] = child;

      //
      // Parse line-delimited JSON values out of child's stdout.
      //
      const childIn = readline.createInterface({
        input: child.stdout,
      });
      childIn.on('line', (lineStr) => {
        try {
          const inObj = JSON.parse(lineStr);
          if (_.isObject(inObj)) {
            console.log(json(augmentObject(inObj, agentId)));
          } else {
            throw new Error('not an object.');
          }
        } catch (e) {
          counts.excludedLines++;
        }
      });

      //
      // Kill agent after its lifetime.
      //
      setTimeout(() => {
        console.error(`${pid}: killing agent ${idx} (${agentId})`);
        try {
          child.kill();
        } catch (e) {
          console.warn(e);
        }
      }, agentLifetime);

      //
      // Wait for all agents to exit.
      //
      child.once('exit', () => {
        delete children[agentId];
        if (_.isEmpty(children)) {
          console.error('All children have exited.');
          return process.exit(0);
        }
      });
    }, spawnOffset);
  });

  //
  // Periodically send system snapshots as long as we're alive.
  //
  health(children);
}


main(minimist(process.argv.slice(2)));
