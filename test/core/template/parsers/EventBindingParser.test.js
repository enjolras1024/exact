describe('core/template/parsers/EventBindingParser', function() {
  describe('EventBindingParser.parse', function() {
    var parse = Exact.EventBindingParser.parse;

    it('parse handler', function() {
      var expression = parse('$.onClick', {}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template.handler).to.equal('onClick');
    });

    it('parse evaluator', function() {
      var expression = parse('$.onClick()', {}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template.evaluator).not.equal(undefined);
    });
  });
});