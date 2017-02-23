//######################################################################################################################
// src/base/Expression.js
//######################################################################################################################
(function() {

  function Expression(compiler, template) {
    this.compiler = compiler; // builder
    this.template = template;
  }

  Expression.create = function create(compiler, template) {
    return new Expression(compiler, template);
  };

  Expression.activate = function activate(expression, property, target, context, locals) {
    var compiler = expression.compiler, template = expression.template;
    if (compiler && compiler.compile) {
      compiler.compile(template, property, target, context, locals);
    }
  };

  Exact.Expression = Expression;

})();
