//######################################################################################################################
// src/utils/EvaluatorUtil.js
//######################################################################################################################
(function() {

  'use strict';

  var RES = Exact.RES;

  function Evaluator(exec, args, back) {
    this.exec = exec;
    this.back = back;
    this.args = args;
  }

  //function $get(val) { return val; }
  function $get(val) { return arguments[arguments.length - 1]; }
  function $not(val) { return !val; }

  function makeEvaluator(exec, args, back) {
    return new Evaluator(exec, args, back);
  }

  function makeGetEvaluator(args) {
    return new Evaluator($get, args);
  }

  function makeNotEvaluator(args) {
    return new Evaluator($not, args);
  }

  function makeExpressionEvaluator(expr, args) {
    return new Evaluator(new Function(args || '', 'var $ = this; return ' + expr + ';'), '$');
  }

  function evaluateArgs(args, flags, scope) {
    var i,  n, arg, flag;

    for (i = 0, n = flags.length; i < n; ++i) {
      flag = flags[i];

      if (!flag) { continue;} // arg is literal

      arg = args[i];

      if (flag === 1) {       // arg is path
        args[i] = RES.search(arg, scope, true);
        continue;
      }

      if (flag === 2) {       // arg is evaluator
        args[i] = applyEvaluator(arg, 'exec', scope);
      }

    }
  }

  /**
   *
   * @param {Evaluator} evaluator
   * @param {string} name - 'exec' or 'back'
   * @param {object} scope
   * @param {Event} event
   * @param {*} value
   * @returns {*}
   */
  function applyEvaluator(evaluator, name, scope, event, value) {
    var $ = null, exec, args, flags, hasFirstValue = arguments.length > 4;

    exec = evaluator[name];

    if (!exec) {
      $ = scope;
      name = evaluator.name;

      var i = name.lastIndexOf('.');

      if (i > 0) {
        $ = RES.search(name.slice(0, i), scope, true);
        name = name.slice(i + 1);
      }

      exec = $[name];
    }

    args = evaluator.args;

    if (!args) {
      return hasFirstValue ? exec.call($, value) : exec.call($);
    }

    if (args === '$') {
      return exec.call(scope, event);
    }

    flags = args.flags;
    args = args.slice(0); //copy

    if (flags) {
      evaluateArgs(args, flags, scope);
    }

    if (hasFirstValue) {
      args.unshift(value);
    }

    return exec.apply($, args);
  }

  Exact.EvaluatorUtil = {
    makeExpressionEvaluator: makeExpressionEvaluator,
    makeGetEvaluator: makeGetEvaluator,
    makeNotEvaluator: makeNotEvaluator,
    makeEvaluator: makeEvaluator,
    applyEvaluator: applyEvaluator
  }
})();
