//######################################################################################################################
// src/core/template/parsers/EvaluatorParser.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;

  var PathUtil = Exact.PathUtil;
  var StringUtil = Exact.StringUtil;
  var LiteralUtil = Exact.LiteralUtil;

  var Evaluator = Exact.Evaluator;

  var ARGUMENT_FLAGS = Evaluator.ARGUMENT_FLAGS;

  var PATH_REGEXP = /^[\w\$]+((\[|\]?\.)[\w\$]+)*$/;                  // a[0].b.c, path
  var PATH_FUNC_REGEXP = /^!?[\w\$]+((\[|\]?\.)[\w\$]+)*(\(.*\))?$/;  // !$.a[0].b.c(), path or func

  //function $get(val) { return val; }
  function $get(val) { return arguments[arguments.length - 1]; }
  function $not(val) { return !val; }

  function makeEvaluator(exec, args, back) {
    return Evaluator.create(exec, args, back);
  }

  function makeGetEvaluator(args) {
    return Evaluator.create($get, args);
  }

  function makeNotEvaluator(args) {
    return Evaluator.create($not, args);
  }

  function makeExpressionEvaluator(expr, identifiers) { // TODO: EvaluatorParser.parse
    var n = identifiers.length;
    
    var args = [], flags = [];
    
    for (var i = 0; i < n; ++i) {
      args.push({origin: i});
      flags.push(ARGUMENT_FLAGS.LOCAL_PATH);
    }

    args.flags = flags;

    var body = makeFunctionBody(expr);

    var exec = Function.apply(null, identifiers.concat([body]));

    return Evaluator.create(exec, args);
  }

  function makeFunctionBody(expr) {
    if ('__DEV__' === 'development') {
      return 'try { return ' + expr + ' } catch (error) { console.error("the expression `' + expr.replace(/('|")/g, '\\$1') + '` is illegal"); throw error; }';
    } else {
      return 'return ' + expr;
    }
  }

  function parseArgs(args, resources, identifiers) { //TODO: 1, $.b, red, exec(), $.f()
    var arg, path, flag, flags, index, res;

    for (var i = 0, n = args.length; i < n; ++i) {
      arg = args[i];
      res = undefined;
      flag = ARGUMENT_FLAGS.INVARIABLE;

      res = LiteralUtil.parse(arg);

      if (res === undefined) {
        if (PATH_REGEXP.test(arg)) { //TODO
          path = PathUtil.parse(arg);
          index = identifiers.indexOf(path[0]);
          if (index < 0) {
            res = RES.search(path, resources);
          } else {
            res = path;
            path.shift();
            path.origin = index;
            flag = ARGUMENT_FLAGS.LOCAL_PATH;
          }
        } else {
          flag = ARGUMENT_FLAGS.EVALUATOR;
          res = parseEvaluator(arg, resources, identifiers);
        }
      }

      args[i] = res;

      if (flag) {
        flags = flags || [];
        flags[i] = flag;
      }
    }

    args.flags = flags;

    return args;
  }

  function parseEvaluator(expr, resources, identifiers) {
    var i, j, k, res, path, args, flags, index, evaluator;

    if (PATH_FUNC_REGEXP.test(expr)) {
      i = expr.indexOf('!');
      j = expr.indexOf('(');

      if (j < 0) { // path, not function
        path = expr.slice(i !== 0 ? 0 : 1);

        res = LiteralUtil.parse(path); // true or false

        if (res === undefined) {
          path = PathUtil.parse(path);
          index = identifiers.indexOf(path[0]);
          if (index < 0) {
            res = RES.search(path, resources);
          } else {
            res = path;
            path.shift();
            path.origin = index;
            flags = [ARGUMENT_FLAGS.LOCAL_PATH];
          }
        }

        args = [res];
        args.flags = flags;

        evaluator = i !== 0 ? makeGetEvaluator(args) : makeNotEvaluator(args);
      } else { // function, possibly
        var range = StringUtil.range(expr, j, '', '()');

        if (range && range[1] === expr.length) {
          path = expr.slice(i < 0 ? 0 : 1, j);
          args = StringUtil.split(expr.slice(j + 1, expr.length - 1), ',', '()');
          args = args.length ? parseArgs(args, resources, identifiers) : null;

          //if (path) {
            path = PathUtil.parse(path);
            index = identifiers.indexOf(path[0]);
            if (path.length > 1 && index >= 0) {
              path.origin = index;
              path.shift();

              evaluator = {
                path: path,
                args: args
              }
            } else {
              res = RES.search(path, resources); // TODO: but maybe x-for="f of fs", @{f()}

              if (!res) {
                throw new Error('can not find such resource `' + path + '`');
              } else if (!res.exec) {
                evaluator = makeEvaluator(res, args);
              } else {
                evaluator = makeEvaluator(res.exec, args, res.back);
              }
            }

            if (i === 0) {
              args = [evaluator];
              args.flags = [ARGUMENT_FLAGS.EVALUATOR]; //TODO: EvaluatorUtil.setFlag(args, index, EvaluatorUtil.FLAG_EVAL)
              evaluator = makeNotEvaluator(args);
            }
          //} else { // @{ (1, 2, $.title) } will return $.title
          //  evaluator = i !== 0 ? makeGetEvaluator(args) : makeNotEvaluator(args);
          //}
        }

      }
    }

    if (!evaluator) {
      evaluator = makeExpressionEvaluator(expr, identifiers);
    }

    return evaluator;
  }

  Exact.EvaluatorParser = {
    /**
     * @param {string} expr
     * @param {Object} resources
     * @returns {Evaluator}
     */
    parse: parseEvaluator
  };

})();
