describe('utils/ExpressionUtil', function() {
  var ExpressionUtil = Exact.ExpressionUtil;

  function Type() {}

  Type.compile = function(template, property, target, scope) {
    chai.expect(template).to.equal(tmpl);
    chai.expect(property).to.equal(prop);
    chai.expect(target).to.equal(obj1);
    chai.expect(scope).to.equal(obj2);
  };

  var tmpl = {};

  var prop = 'name';
  var obj1 = {};
  var obj2 = {};


  var expr;

  describe('ExpressionUtil.makeExpression', function() {
    it('make an expr', function() {
      expr = ExpressionUtil.makeExpression(Type, tmpl);
      chai.expect(expr.type).to.equal(Type);
      chai.expect(expr.template).to.equal(tmpl);
    });
  });

  describe('ExpressionUtil.isExpression', function() {
    it('check if an object is an expr', function() {
      chai.expect(ExpressionUtil.isExpression({})).to.equal(false);
      chai.expect(ExpressionUtil.isExpression(expr)).to.equal(true);
    });
  });

  describe('ExpressionUtil.applyExpression', function() {
    it('apply an expr', function() {
      ExpressionUtil.applyExpression(expr, obj2, obj1, prop);
    });
  });
});
