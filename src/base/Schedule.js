//######################################################################################################################
// src/base/Schedule.js
//######################################################################################################################
(function() {

  var setImmediate = Exact.setImmediate;

  var pool = [], queue = [], cursor = 0, waiting = false, running = false;

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

    waiting = false;
    running = false;
    queue.splice(0); //queue.length = 0;
    pool.splice(0); //pool.length = 0;
    cursor = 0;
  }

  Exact.Schedule = {
    /**
     * target to be inserted must have `guid` and method `update`
     * @param {Object} target
     */
    insert: function(target) {
      //if (!target || !target.update) { return; }
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
      }
    },

    /**
     * target to be appended must have method `render`
     * @param {Object} target
     */
    append: function(target) {
      //if (!target || !target.render) { return; }
      queue.push(target);
    }
  };

})();
