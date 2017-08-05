describe('core/template/parsers/EvaluatorParser', function() {
  describe('EvaluatorParser.parse', function() {
    var parse = Exact.EvaluatorParser.parse;
    var activate = Exact.Evaluator.activate;
    it('literal', function() {
      var evaluator = parse('1234', {}), item = {};

      chai.expect(evaluator.exec(item)).to.equal(item);
      chai.expect(evaluator.args.slice(0)).to.deep.equal([1234]);
      chai.expect(evaluator.args.flags).to.equal(undefined);
      chai.expect(activate(evaluator, 'exec')).to.equal(1234);
      chai.expect(evaluator.exec.apply(null, evaluator.args)).to.equal(1234);
    });

    it('variable path', function() {
      var evaluator = parse('$.a', {}, ['$']);

      var path = ['a'];
      path.origin = 0;

      chai.expect(evaluator.args[0]).to.deep.equal(path);
      chai.expect(evaluator.args.flags).to.deep.equal([1]);
      chai.expect(activate(evaluator, 'exec', [{a: 'aaa'}])).to.equal('aaa');

      evaluator = parse('!$.a', {}, ['$']);

      chai.expect(evaluator.exec(true)).to.equal(false);
      chai.expect(evaluator.args[0]).to.deep.equal(path);
      chai.expect(evaluator.args.flags).to.deep.equal([1]);
      chai.expect(activate(evaluator, 'exec', [{a: false}])).to.equal(true);
    });

    it('invariable resource', function() {
      var evaluator = parse('OK', {OK: 'ok'}, []);

      chai.expect(evaluator.args.slice(0)).to.deep.equal(['ok']);
      chai.expect(evaluator.args.flags).to.equal(undefined);
      chai.expect(activate(evaluator, 'exec')).to.equal('ok');
    });

    it('evaluator resources', function() {
      var resources = {
        N: 10,
        sum: function(a, b) { return a + b; },
        mul: function(a, b) { return a * b; }
      };

      var evaluator = parse("sum(N, mul(2, $.x))", resources, ['$']);

      chai.expect(evaluator.exec).to.equal(resources.sum);
      chai.expect(evaluator.args[1].exec).to.equal(resources.mul);
      chai.expect(activate(evaluator, 'exec', [{x: 5}])).to.equal(20);

      resources = {
        num2str: {
          exec: String,
          back: Number
        }
      };

      var converter = parse("num2str()", resources, []);
      chai.expect(converter.exec).to.equal(resources.num2str.exec);
      chai.expect(converter.back).to.equal(resources.num2str.back);

      var error;
      try {
        parse('sum(1, 2)', {}, []);
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.be.instanceOf(Error);
    });

    it('instance method as evaluator', function() {
      chai.expect(activate(parse('!$.isOk()', {}, ['$']), 'exec', [{isOk: function() { return true; }}])).to.equal(false);
    });

    it('javascript expression', function() {
      chai.expect(activate(parse('1 + 2', null, ['$']), 'exec', [{}])).to.equal(3);
      chai.expect(activate(parse('1 < 2 ? 3 : 4', null, ['$']), 'exec', [{}])).to.equal(3);
      chai.expect(activate(parse('Math.sin(0) === 0', null, ['$']), 'exec', [{}])).to.equal(true);
    });
  });
});