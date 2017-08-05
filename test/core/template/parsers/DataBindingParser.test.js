describe('core/template/parsers/DataBindingParser', function() {
  describe('DataBindingParser.parse', function() {
    var parse = Exact.DataBindingParser.parse;

    it('parse one-way data binding', function() {
      var expression = parse('@', '$.amount', {}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.compiler).to.equal(Exact.DataBinding);
      chai.expect(expression.template.mode).to.equal(1);
      chai.expect(!!expression.template.event).to.equal(false);
      chai.expect(expression.template.paths.length).to.equal(1);
      chai.expect(expression.template.evaluator).not.equal(undefined);
      chai.expect(Exact.Evaluator.activate(expression.template.evaluator, 'exec', [{amount: 100}])).equal(100);
      chai.expect(expression.template.converters).equal(undefined);
    });

    it('parse two-way data binding', function() {
      var num2str = {
        exec: String,
        back: Number
      };
      var expression = parse('#', '$.amount | num2str', {num2str: num2str}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.compiler).to.equal(Exact.DataBinding);
      chai.expect(expression.template.mode).to.equal(2);
      chai.expect(!!expression.template.event).to.equal(false);
      chai.expect(expression.template.paths.length).to.equal(1);
      chai.expect(expression.template.evaluator).not.equal(undefined);
      chai.expect(Exact.Evaluator.activate(expression.template.converters[0], 'exec', [], 100)).equal('100');
      chai.expect(Exact.Evaluator.activate(expression.template.converters[0], 'back', [], '100')).equal(100);

      var error;
      try {
        expression = parse('#', '$.amount * 2', {}, ['$']);
      } catch (err) {
        error = err;
      }
      chai.expect(error).not.equal(undefined);
    });

    it('parse one-time data binding on event', function() {
      var expression = parse('&', '$.amount ^load', {}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.compiler).to.equal(Exact.DataBinding);
      chai.expect(expression.template.mode).to.equal(0);
      chai.expect(expression.template.event).to.equal('load');
      chai.expect(!!expression.template.paths).to.equal(false);
      chai.expect(expression.template.evaluator).not.equal(undefined);
      chai.expect(expression.template.converters).equal(undefined);

      expression = parse('@', '$.amount ^', {}, ['$']);
      chai.expect(expression.template.event).to.equal('updated');
    });

    it('parse one-time data binding on event', function() {
      var expression = parse('@', '$.amount * $.price | $.filter(I)', {I: 1}, ['$']);
      chai.expect(expression.template.paths.length).equal(2);
    });

    it('parse unknown data binding, return null', function() {
      var expression = parse('*', '$.amount ^load', {}, ['$']);
      chai.expect(expression).equal(null);
    });
  });
});