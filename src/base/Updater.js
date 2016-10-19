//######################################################################################################################
// src/base/Updater.js
//######################################################################################################################
(function() {
  //TODO: schedule...
  'use strict';

  var setImmediate = Exact.setImmediate;

  var pool = [], queue = [], cursor = 0, /*count = 0,*/ waiting = false, running = false;

  /**
   *
   * @constructor
   */
  function Updater() {
    throw new Error('');
  }

  Exact.defineClass({
    constructor: Updater,

    statics: {
      insert: function(target) {
        if (!target) { return; }

        var i, n = pool.length, id = target.guid;

        if (!running) {
          i = n - 1;
          while (i >= 0 && id < pool[i].guid) {
            --i;
          }
          ++i;
        } else {
          i = cursor;
          while (i < n && id >= pool[i].guid) {
            ++i;
          }
        }

        pool.splice(i, 0, target);

        if (!waiting) {
          waiting = true;

          setImmediate(run);

          //if (__DEV__ === 'development') {
          //  Exact.Shadow.refreshed = 0;
          //}
        }
      },

      append: function(target) {
        queue.push(target);
      }
    }
  });

  function run() {

    cursor = 0;
    running = true;

    var target; //TODO: func, args

    while (cursor < pool.length) {
      target = pool[cursor];

      target.update();

      ++cursor;
    }

    for (var i = 0, n = queue.length; i < n; ++i) {
      target = queue[i];

      target.render();
    }

    //if (__DEV__ === 'development') {
    //  console.log('==== executed', pool.length, '==== refreshed', Exact.Shadow.refreshed, '====');
    //}

    waiting = false;
    running = false;
    queue.splice(0);
    pool.splice(0); //pool.length = 0;
    cursor = 0;
    //pool.push.apply(pool, pool);
  }

  Exact.Updater = Updater;

})();
