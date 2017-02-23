//######################################################################################################################
// src/core/parsers/DataBindingParser.js
//######################################################################################################################
(function() {

  var PathUtil = Exact.PathUtil;
  var StringUtil = Exact.StringUtil;

  var Expression = Exact.Expression;
  var DataBinding = Exact.DataBinding;

  var EvaluatorParser = Exact.EvaluatorParser;

  var EVENT_OPERATOR = Exact.EVENT_OPERATOR;//'*';

  var BINDING_OPERATORS = Exact.BINDING_OPERATORS;

  var DATA_BINDING_MODES = DataBinding.MODES;

  /* /\*(\w(\.\w+)?)*[ ]*$/ */
  var EVENT_REGEXP = new RegExp('\\' + EVENT_OPERATOR + '(\\w(\\.\\w+)?)*[ ]*$');

  var PATH_REGEXP = /^[\w\$]+((\[|\]?\.)[\w\$]+)+$/;

  var PATH_FUNC_REGEXP = /[\w\$]+((\[|\]?\.)[\w\$]+)+\(?/g;

  function collectPaths(expr, paths, identifiers) {
    var matches, match, path;//, paths = [];

    matches = expr.match(PATH_FUNC_REGEXP);

    if (!matches) { return; }

    for (var i = 0, n = matches.length; i < n; ++i) {
      match = matches[i];

      path = PathUtil.parse(match);

      if (match[match.length - 1] === '(') {
        path.pop();
      }

      if (path.length < 2) { continue; }

      for (var j = 0, m = identifiers.length; j < m; ++j) {
        if (path[0] === identifiers[j]) {
          path.shift();
          path.origin = j;
          paths.push(path);
        }
      }
    }
  }

  /**
   *
   * @param {string} operator
   * @param {string} expr
   * @param {Object} resources
   * @param {Array} identifiers
   * @returns {*}
   */
  function parse(operator, expr, resources, identifiers) { //TODO: parse(operator, expression, resources)
    var mode = -1, tail = '', event, i, j;

    switch (operator) {
      case BINDING_OPERATORS.ONE_TIME:
        mode = DATA_BINDING_MODES.ONE_TIME;
        break;
      case BINDING_OPERATORS.ONE_WAY:
        mode = DATA_BINDING_MODES.ONE_WAY;
        break;
      case BINDING_OPERATORS.TWO_WAY:
        mode = DATA_BINDING_MODES.TWO_WAY;
        break;
      default :
        return null;
    }

    if (EVENT_REGEXP.test(expr)) {
      i = expr.lastIndexOf(EVENT_OPERATOR);

      tail = expr.slice(i + 1);
      expr = expr.slice(0, i);

      event = tail.trim();

      if (!event) {
        event = 'updated';
      }
    }

    var piece, pieces = StringUtil.split(expr, '|', '()'),  converters, evaluator, n;

    piece = pieces[0].trim();

    if (mode === DATA_BINDING_MODES.TWO_WAY && !PATH_REGEXP.test(piece)) {
      throw new Error('Illegal two-way binding expression `' + expr + '`');
    }

    evaluator = EvaluatorParser.parse(piece, resources, identifiers);

    if (!event) {
      var paths = [];
      collectPaths(piece, paths, identifiers);
    }

    if (pieces.length > 1) {
      converters = [];

      for (i = 1, n = pieces.length; i < n; ++i) {
        piece = pieces[i].trim();

        if (piece[piece.length - 1] !== ')') {
          piece += '()';
        }

        if (!event) {
          collectPaths(piece, paths, identifiers);
        }

        converters.push(EvaluatorParser.parse(piece, resources, identifiers));
      }

      if ('__DEV__' === 'development') {
        if (n > 2) {
          console.warn(expr, 'better not use converters more than 2');
        }
      }
    }

    var template = {
      mode: mode,
      event: event,
      paths: paths,
      evaluator: evaluator,
      converters: converters
    };

    return Expression.create(DataBinding, template);
  }

  Exact.DataBindingParser = {
    parse: parse
  }

})();
