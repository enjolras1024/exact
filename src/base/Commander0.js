//######################################################################################################################
// src/base/Commander.js
//######################################################################################################################
(function() {
  //TODO: schedule...
  'use strict';

  var Array$slice = [].slice;

  var setImmediate = Exact.setImmediate;


  /**
   * @internal
   * @constructor
   */
  function Command() {
    this.exec = null;
    this.args = null;
  }

  var commandsQueue = [], begin = 0, cursor = 0, flag = false, running = false;

  /**
   *
   * @constructor
   */
  function Commander() {
    throw new Error('');
  }

  Exact.defineClass({
    constructor: Commander,

    statics: {
      enqueue: function(exec) {
        if (!exec) { return; }

        var args;
        if (arguments.length > 1) {
          args = Array$slice.call(arguments, 1);
        }

        //if (running) {
        //  if (!args) {
        //    exec();
        //  } else {
        //    exec.apply(null, args);
        //  }
        //}

        var command;

        if (begin > 0) {
          command = commandsQueue.shift();
          --begin;
          --cursor;
        } else {
          command = new Command();
        }

        command.args = args;
        command.exec = exec;

        commandsQueue.push(command);

        if (!flag) {
          flag = true;

          setImmediate(run);

          if (__DEV__ === 'development') {
            Exact.Shadow.refreshed = 0;
          }
        }
      }
    }
  });

  function run() {

    running = true;

    var command, exec, args; //TODO: func, args

    while (cursor < commandsQueue.length) {
      command = commandsQueue[cursor];
      exec = command.exec;
      args = command.args;

      if (exec) {
        if (!args) {
          exec();
        } else {
          exec.apply(null, args);
        }
      }

      ++cursor;
    }

    if (__DEV__ === 'development') {
      console.log('==== executed', commandsQueue.length - begin, '==== refreshed', Exact.Shadow.refreshed, '====');
    }

    flag = false;
    begin = cursor;
    running = false;
  }

  Exact.Commander = Commander;

})();
