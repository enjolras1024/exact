describe('base/Expression', function() {
  var Expression = Exact.Expression;

  function Compiler() {}

  Compiler.compile = function(template, property, target, context, locals) {
    chai.expect(template).to.equal(tmpl);
    chai.expect(property).to.equal(prop);
    chai.expect(target).to.equal(obj1);
    chai.expect(context).to.equal(obj2);
    chai.expect(locals).to.equal(arr);
  };

  var tmpl = {};

  var prop = 'name';
  var obj1 = {};
  var obj2 = {};
  var arr = [];

  var expr;

  describe('Expression.create', function() {
    it('create an expression', function() {
      expr = Expression.create(Compiler, tmpl);
      chai.expect(expr.compiler).to.equal(Compiler);
      chai.expect(expr.template).to.equal(tmpl);
    });
  });

  describe('Expression.activate', function() {
    it('activate an expression', function() {
      Expression.activate(expr, prop, obj1, obj2, arr);
    });
  });
});
