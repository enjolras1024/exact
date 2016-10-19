//######################################################################################################################
// src/utils/ExpressionUtil.js
//######################################################################################################################
(function() {
  'use strict';

  function Expression(type, template) {
    this.type = type; // indicate the type of the expression template
    this.template = template;
  }

  var ExpressionUtil = {
    isExpression: function(value) {
      return value instanceof Expression;
    },

    makeExpression: function(type, template) {
      return new Expression(type, template);
    },

    applyExpression: function(expression, scope, target, property) {
      var type = expression.type, template = expression.template;
      if (type && type.compile) {
        type.compile(template, property, target, scope);
      }
    }
  };

  Exact.ExpressionUtil = ExpressionUtil;

})();
