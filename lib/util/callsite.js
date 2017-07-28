const _ = require('lodash');


const STACK_LINE_RE_1 = /^\s+at (.+) \((\S+):(\d+):(\d+)\)/;
const STACK_LINE_RE_2 = /^\s+at (.+):(\d+):(\d+)/;
const FILTER_SYMBOLS = [/^ConsoleLog/];

module.exports = function getCallsite(stack, filterExtraSymbols) {
  //
  // This is a horrible, ugly, necessary way to extract information.
  //
  if (!stack) {
    stack = (new Error()).stack.toString().split('\n');
  } else {
    stack = stack.toString().split('\n');
  }

  //
  // Extract callsites from stack lines.
  //
  let cleanStack = _.filter(_.map(stack, (stackLine) => {
    stackLine = stackLine.replace(/\[as .*?\]\s*/, '');

    //
    // Try pattern 1.
    //
    let parts = STACK_LINE_RE_1.exec(stackLine);
    if (parts && parts.length) {
      return {
        symbol: parts[1],
        absPath: parts[2],
        line: _.toInteger(parts[3]),
        column: _.toInteger(parts[4]),
      };
    }

    //
    // Try pattern 2.
    //
    parts = STACK_LINE_RE_2.exec(stackLine);
    if (parts && parts.length) {
      return {
        absPath: parts[1],
        line: _.toInteger(parts[2]),
        column: _.toInteger(parts[3]),
      };
    }
  }));

  //
  // Filter out syslog, callsite, internal node symbols
  //
  const allFilters = _.filter(_.concat(FILTER_SYMBOLS, filterExtraSymbols));
  cleanStack = _.filter(cleanStack, (stackLine) => {
    const symbol = stackLine.symbol || '';
    if (symbol === getCallsite.name) {
      return;
    }
    if (!stackLine.absPath) {
      return;
    }
    if (_.find(allFilters, filt => filt.exec(symbol))) {
      return;
    }
    return true;
  });

  const result = {
    clean: cleanStack,
    full: stack.toString(),
  };

  if (cleanStack.length) {
    const caller = cleanStack[0];
    result.summary = `${caller.absPath}:${caller.line}`;
  }

  return result;
};
