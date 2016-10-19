//######################################################################################################################
// src/htmx/parsers/HandlerParser.js
//######################################################################################################################
(function() {

  'use strict';

  var EvaluatorUtil = Exact.EvaluatorUtil;
  var ExpressionUtil = Exact.ExpressionUtil;

  var HandlerTemplate = Exact.HandlerTemplate;

  var ExpressionParser = Exact.ExpressionParser;

  function parse(expr) {
    expr = expr.trim();

    var template = new HandlerTemplate();

    if (/^[\w\$]+$/.test(expr)) {
      template.name = expr;
    } else {
      template.exec = EvaluatorUtil.makeExpressionEvaluator(expr, 'event').exec;
    }

    return ExpressionUtil.makeExpression(HandlerTemplate, template);
  }

  ExpressionParser.registerHelper('@', parse);

  Exact.HandlerParser = {
    parse: parse
  };

})();
