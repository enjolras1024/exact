//######################################################################################################################
// src/base/Evaluator.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;

  var emptyArray = [];

  var ARGUMENT_FLAGS = {
    EVALUATOR: -1,
    INVARIABLE: 0,
    LOCAL_PATH: 1
  };

  function genArgs(args, locals) {
    var i, n, l, path, origin, flag, flags = args.flags, results = args.slice(0);

    if (flags && flags.length) {
      for (i = 0, n = flags.length; i < n; ++i) {
        flag = flags[i];

        if (flag === ARGUMENT_FLAGS.LOCAL_PATH) {
          path = args[i];
          l = path.length;
          origin = locals[path.origin];
          results[i] = l === 1 ? origin[path[0]] : (l ? RES.search(path, origin, true) : origin);
        } else if (flag === ARGUMENT_FLAGS.EVALUATOR) {
          results[i] = activate(args[i], 'exec', locals);
        }
      }
    }

    return results;
  }

  /**
   *
   * @param {Evaluator} evaluator
   * @param {string} name - 'exec' or 'back'
   * @param {Array} locals
   * @param {*} value
   * @returns {*}
   */
  function activate(evaluator, name, locals, value) {
    var ctx = null, exec, args;

    exec = evaluator[name];

    if (!exec) {
      var path = evaluator.path;
      var n = path.length - 1;

      if (!n) {
        ctx = locals[path.origin];
      }  else {
        ctx = RES.search(path.slice(0, n), locals[path.origin], true);
      }

      exec = ctx[path[n]];
    }

    args = genArgs(evaluator.args || emptyArray, locals);

    if (arguments.length > 3) {
      args.unshift(value);
    }

    return exec.apply(ctx, args);
  }

  function Evaluator(exec, args, back) {
    this.exec = exec;
    this.back = back;
    this.args = args;
  }

  Evaluator.ARGUMENT_FLAGS = ARGUMENT_FLAGS;

  Evaluator.activate = activate;

  Evaluator.create = function create(exec, args, back) {
    return new Evaluator(exec, args, back);
  };

  Exact.Evaluator = Evaluator;
  
})();
