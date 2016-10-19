//######################################################################################################################
// src/htmx/parsers/StyleXParser.js
//######################################################################################################################
(function() {
  'use strict';

  var StringUtil = Exact.StringUtil;
  var LiteralUtil = Exact.LiteralUtil;

  var TextStringParser = Exact.TextStringParser;
  var ExpressionParser = Exact.ExpressionParser;

  var StyleXTemplate = Exact.StyleXTemplate;

  Exact.StyleXParser = {
    /**
     * @example
     *    <div x-style="color: red; backgroundColor: &{$.bgColor | hex2rgb}; fontSize: `${$.fontSize}px`">
     *      <div x-class="btn: true; active: ${$.a > $.b}"></div>
     *    </div>
     *
     * @param {string} expr
     * @param {Object} imports
     * @param {string} type
     * @returns {StyleXTemplate}
     */
    parse: function(expr, imports, type) {// + target type, target prop
      var i, j, n, key, piece, pieces = StringUtil.split(expr, ';', '{}'), literals, expressions, expression;

      for (i = 0, n = pieces.length; i < n; ++i) {
        piece = pieces[i];

        j = piece.indexOf(':');
        key = piece.slice(0, j).trim();

        if (!key) {
          throw new Error('key should not be empty');
        }

        expression = null;
        expr = piece.slice(j+1).trim();

        if (ExpressionParser.isExpression(expr)) {
          expression = ExpressionParser.parse(expr, imports);
        } else if (TextStringParser.isStringTemplate(expr)) {
          expression = TextStringParser.parse(expr, imports);
        }

        if (expression) {
          expressions = expressions || {};
          expressions[key] = expression;
        } else {
          literals = literals || {};
          literals[key] = type ? LiteralUtil.parse(expr, type) : expr;
        }
      }

      return new StyleXTemplate(literals, expressions);
    }
  };

})();
