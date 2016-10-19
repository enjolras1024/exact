//######################################################################################################################
// src/htmx/parsers/TextStringParser.js
//######################################################################################################################
(function() {
  'use strict';

  var StringTemplate = Exact.StringTemplate;
  var ExpressionUtil = Exact.ExpressionUtil;
  var ExpressionParser = Exact.ExpressionParser;

  //var BINDING_REGEXP = /([\$&#]\{.+\})/;
  var BINDING_REGEXP = /([\$&#]\{.+?\})/;
  //var BINDING_REGEXP = /([\$&#]\{[^\{\}]+\})/;

  //var TEXT_FRAG_REG_EXP = /^`.*([@&\$]\{[\$\w\.]+\}).*`$/;
  //var TEXT_FRAG_REG_EXP = /^`[^`]*([@&\$]\{[\$\w\.\, ]*(\|[^`]+)*\})[^`]*`$/;
  var STRING_TEMPLATE_REG_EXP = /^`[^`]*([@&\$]\{[^`]+})[^`]*`$/;


  Exact.TextStringParser = {

    isStringTemplate: function (expr) {
      return typeof expr === 'string' ? STRING_TEMPLATE_REG_EXP.test(expr) : false;
    },

    /**
     * @example
     *    <div title="`The title is &{$.title}`">`${$.a} + ${$.b} = ${$.a + $.b}`</div>
     *
     * @param {string} expr
     * @param {Object} imports
     * @returns {*}
     */
    parse: function(expr, imports) {
      expr = expr.trim().slice(1, expr.length-1);

      var i, n, piece, pieces = expr.split(BINDING_REGEXP), expression;

      pieces.mode = 0;

      for (i = 0, n = pieces.length; i < n; i += 2) {
        piece = pieces[i+1];

        if (piece) {
          expression = ExpressionParser.parse(piece, imports);

          pieces[i+1] = expression;

          if (expression.template.mode > 0) {
            pieces.mode = 1;
          }
        }
      }

      return ExpressionUtil.makeExpression(StringTemplate, pieces);
    }
  };

})();
