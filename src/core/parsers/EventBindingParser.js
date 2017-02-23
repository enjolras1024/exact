//######################################################################################################################
// src/core/parsers/EventBindingParser.js
//######################################################################################################################
(function() {

  var Expression = Exact.Expression;
  var EventBinding = Exact.EventBinding;
  var EvaluatorParser = Exact.EvaluatorParser;

  /* /^\$\.[\w\$]+$/ */
  var OFFSET = Exact.CONTEXT_SYMBOL.length + 1;
  var HANDLER_REGEXP = new RegExp('^\\' + Exact.CONTEXT_SYMBOL + '\\.[\\w\\$]+$');

  function parse(expr, resources, identifiers) {
    expr = expr.trim();

    var template = {};

    if (HANDLER_REGEXP.test(expr)) {
      template.handler = expr.slice(OFFSET); // TODO:
    }  else {
      template.evaluator = EvaluatorParser.parse(expr, resources, ['event'].concat(identifiers));
    }

    return Expression.create(EventBinding, template);
  }

  Exact.EventBindingParser = {
    parse: parse
  };

})();
