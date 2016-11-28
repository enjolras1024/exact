//######################################################################################################################
// src/htmx/parsers/BindingParser.js
//######################################################################################################################
(function() {
  'use strict';

  var RES = Exact.RES;

  var StringUtil = Exact.StringUtil;
  var LiteralUtil = Exact.LiteralUtil;
  var EvaluatorUtil = Exact.EvaluatorUtil;
  var ExpressionUtil = Exact.ExpressionUtil;

  var BindingTemplate = Exact.BindingTemplate;

  var ExpressionParser = Exact.ExpressionParser;

  var StringUtil_split = StringUtil.split;

  var makeEvaluator = EvaluatorUtil.makeEvaluator;
  var makeGetEvaluator = EvaluatorUtil.makeGetEvaluator;
  var makeNotEvaluator = EvaluatorUtil.makeNotEvaluator;
  var makeExpressionEvaluator = EvaluatorUtil.makeExpressionEvaluator;

  var REGEXP_1 = /^[\w\$]+((\[|\]?\.)[\w\$]+)*$/; //a[0].b.c, path
  var REGEXP_2 = /^!?[\w\$]+((\[|\]?\.)[\w\$]+)*(\(.*\))?$/; //!$.a[0].b.c(), path or func
  var REGEXP_3 = /\$((\[|\]?\.)[\w\$]+)+(?!\()/g; //$.a[0].b.c(), path on scope
  var REGEXP_4 = /^\$((\[|\]?\.)[\w\$]+)+$/; //

  function likeFuncExpr(expr, i) {
    var n = expr.length, ct, cc, cb, iq;

    if (i >= 0/* && i < n - 1*/) {
      ct = 1;

      while (++i < n) {
        cc = expr.charAt(i);

        if (cc === "'" && cb != "\\") {
          cb = cc;
          iq = !iq;
        }

        if (iq) {
          continue;
        }

        if (cc === ')') {
          --ct;
          if (!ct) {
            break;
          }
        } else if (cc === '(') {
          ++ct;
        }
      }

      if (ct) {
        throw new Error('expression "'+expr+'" is illegal');
      }
    }

    return i === n-1;
  }

  function parseArgs(args, imports) { //TODO: 1, $.b, red, exec(), $.f()
    var arg, res, flag, flags, parsed;

    flags = args.flags;

    for (var i = 0, n = args.length; i < n; ++i) {
      arg = args[i];

      flag = 0; //constant
      parsed = undefined;

      parsed = LiteralUtil.parse(arg);

      if (parsed === undefined) {
        if (REGEXP_1.test(arg)) { //TODO
          flag = 1; //path
          parsed = arg.slice(2);
        } else {
          res = RES.search(arg, imports);

          if (res) {
            parsed = res;
          } else {
            flag = 2; //evaluator
            parsed = parseEvaluator(arg, imports);
          }
        }
      }

      args[i] = parsed;

      if (flag) {
        if (!flags) {
          flags = args.flags = [];
        }

        flags[i] = flag;
      }
    }

    return args;
  }

  function parseEvaluator(expr, imports) {
    var i, j, k, l, res, path, args, evaluator;

    if (REGEXP_2.test(expr)) {
      i = expr.indexOf('!');
      j = expr.indexOf('$.');
      l = expr.indexOf('(');

      i = i === 0 ? 1 : 0;
      j = j === i ? 1 : 0;

      k = i + j * 2;

      if (l < 0) { // path, not function
        args = [];
        path = expr.slice(k);

        if (j) {
          res = path;
          args.flags = [1]; //TODO: EvaluatorUtil.setFlag(args, index, EvaluatorUtil.FLAG_PATH)
        } else {
          res = LiteralUtil.parse(path);

          if (res === undefined) {
            res = RES.search(path, imports);
          }
        }

        args.push(res);

        evaluator = i ? makeNotEvaluator(args) : makeGetEvaluator(args);
      } else if (likeFuncExpr(expr, l)) { // function, possible but maybe illegal
        path = expr.slice(k, l);
        args = StringUtil_split(expr.slice(l + 1, expr.length - 1), ',', '()');

        if (args.length) {
          args = parseArgs(args, imports);
        } else {
          args = null;
        }

        if (path) {
          if (j) {
            evaluator = {
              name: path, args: args
            }
          } else {
            res = RES.search(path, imports);

            if (!res) {
              throw new Error('no such resource');
            } else if (!res.exec) {
              evaluator = makeEvaluator(res, args);
            } else {
              evaluator = makeEvaluator(res.exec, args, res.back);
            }
          }

          if (i) {
            args = [evaluator];
            args.flags = [2]; //TODO: EvaluatorUtil.setFlag(args, index, EvaluatorUtil.FLAG_EVAL)
            evaluator = makeNotEvaluator(args);
          }
        } else { // ${ (1, 2, $.title) } will return $.title
          evaluator = i ? makeNotEvaluator(args) : makeGetEvaluator(args);
        }
      }
    }

    if (!evaluator) {
      evaluator = makeExpressionEvaluator(expr);
    }

    return evaluator;
  }

  function extractScopePaths(expr) {
    var paths = expr.match(REGEXP_3);

    if (paths) {
      for (var i = 0, n= paths.length; i < n; ++i) {
        paths[i] = paths[i].slice(2);
      }
    }

    return paths;
  }

  /**
   *
   * @param {string} symbol
   * @param {string} expr
   * @param {Object} imports
   * @returns {*}
   */
  function parse(symbol, expr, imports) {
    var mode = 1, tail, scopeEvent, i, j;

    switch (symbol) {
      case '$':
        mode = 1;
        break;
      case '&':
        mode = 0;
        break;
      case '#':
        mode = 2;
        break;
    }

    i = expr.lastIndexOf('@');

    if (i > expr.lastIndexOf("'")) {
      tail = expr.slice(i + 1);
      expr = expr.slice(0, i);

      scopeEvent = tail.trim();

      if (!scopeEvent) {
        scopeEvent = 'refreshed'
      }
    }


    if (mode > 0 && !scopeEvent) {
      var scopePaths = extractScopePaths(expr);// TODO: later
    }

    var piece, pieces = StringUtil_split(expr, '|', '()'),  converters, evaluator, n; //TODO

    piece = pieces[0];
    if (mode < 2) {
      evaluator = parseEvaluator(piece, imports);
    } else if (!REGEXP_4.test(piece)) {
      throw new Error('Illegal two-way binding expression');
    }

    if (pieces.length > 1) {
      converters = [];

      for (i = 1, n = pieces.length; i < n; ++i) {
        piece = pieces[i];
        //if (piece.indexOf('(') < 0) {
        if (piece[piece.length - 1] !== ')') {
          piece += '()';
        }

        converters.push(parseEvaluator(piece, imports));
      }
    }

    var template = new BindingTemplate();

    template.mode = mode;
    template.evaluator = evaluator;
    template.converters = converters;
    template.scopePaths = scopePaths;
    template.scopeEvent = scopeEvent;

    return ExpressionUtil.makeExpression(BindingTemplate, template);
  }

  var BINDING_SYMBOLS = {
    ONE_WAY: '$', ONE_TIME: '&', TWO_WAY: '#'
  };

  var key, symbol;

  function getBindingParser(symbol) {
    return function(config, imports) {
      return parse(symbol, config, imports);
    };
  }

  for (key in BINDING_SYMBOLS) {
    if (BINDING_SYMBOLS.hasOwnProperty(key)) {
      symbol = BINDING_SYMBOLS[key];

      ExpressionParser.registerHelper(symbol, getBindingParser(symbol));
    }
  }

  Exact.BindingParser = {
    parse: parse
  }

})();
