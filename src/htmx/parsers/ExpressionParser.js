//######################################################################################################################
// src/htmx/parsers/ExpressionParser.js
//######################################################################################################################
(function() {

  'use strict';

  var helpers = {};

  //var IS_VAR_REG_EXP = /^(\S+)\{[\S ]+\}$/;
  var IS_EXPR_REG_EXP = /^\S+\{.*\}$/;

  Exact.ExpressionParser = {

    isExpression: function(expr) {
      return typeof expr === 'string' ? IS_EXPR_REG_EXP.test(expr) : false;
    },

    registerHelper: function(symbol, helper) {
      if (helpers.hasOwnProperty(symbol)) {
        return false;
      }

      helpers[symbol] = helper;

      return true;
    },

    /**
     * @example
     *    <div click="@{onClick}" title="&{$.title | upper}">
     *      <label>`&{$.label}:`</label>
     *      <input type="text" x-type="TextBox" value="#{$.username}">
     *    </div>
     *
     * @param {string} expr
     * @param {Object} imports
     * @returns {*}
     */
    parse: function(expr, imports) {
      var i, j, symbol, config, helper;

      i = expr.indexOf('{');
      j = expr.lastIndexOf('}');

      symbol = expr.slice(0, i);
      config = expr.slice(i+1, j); //expr.length-1

      helper = helpers[symbol];

      return helper && helper(config, imports);
    }
  };

})();
