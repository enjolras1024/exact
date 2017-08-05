describe('core/bindings/Binding', function() {
  var Binding = Exact.Binding;
  var EvaluatorUtil = Exact.EvaluatorUtil;

  describe('Binding.build & Binding.clean', function() {
    it('one-time binding ', function() {
      var target = {};
      var scope = {a: {b: 1}};
      var paths = ['a.b'];
      paths.flags = [1];

      var binding = Binding.build(target, 'c', scope, {
        mode: 0,
        evaluator: EvaluatorUtil.makeGetEvaluator(paths),
        scopePaths: paths
      });

      chai.expect(target.c).to.equal(scope.a.b);

      scope.a.b = 2;
      chai.expect(target.c).to.equal(1);
      chai.expect(target.c).to.not.equal(scope.a.b);

      Binding.clean(binding);
    });

    //it('one-time binding with converters', function() {
    //  var target = {};
    //  var scope = {a: {b: 'abc'}};
    //  var paths = ['a.b'];
    //  paths.flags = [1];
    //
    //  var binding = Binding.build(target, 'c', scope, {
    //    mode: 0,
    //    evaluator: EvaluatorUtil.makeGetEvaluator(paths),
    //    converters: [
    //      EvaluatorUtil.makeEvaluator(function(val) {
    //        return val.toUpperCase();
    //      })
    //    ],
    //    scopePaths: paths
    //  });
    //
    //  chai.expect(target.c).to.equal('ABC');
    //
    //  Binding.clean(binding);
    //});

    it('one-way binding ', function() {
      var target = {};
      var scope = new Exact.Store({x:1});
      var paths = ['x'];
      paths.flags = [1];

      var binding =  Binding.build(target, 'y', scope, {
        mode: 1,
        evaluator: EvaluatorUtil.makeGetEvaluator(paths),
        scopePaths: paths
      });

      chai.expect(target.y).to.equal(scope.x);

      scope.x = 2;
      chai.expect(target.y).to.equal(1);
      chai.expect(target.y).to.not.equal(scope.x);

      scope.set('x', 3);
      chai.expect(target.y).to.equal(scope.x);

      Binding.clean(binding);

      scope.set('x', 4);
      chai.expect(target.y).to.equal(3);
      chai.expect(target.y).to.not.equal(scope.x);
    });

    it('one-way binding with converters', function() {
      var target = {};
      var scope = new Exact.Store({x: 'mySql'});
      var paths = ['x'];
      paths.flags = [1];

      var binding =  Binding.build(target, 'y', scope, {
        mode: 1,
        evaluator: EvaluatorUtil.makeGetEvaluator(paths),
        converters: [
          EvaluatorUtil.makeEvaluator(function(val) {
            return val.replace(/([A-Z])/g, function(match, char) {
              return '-' + char;//.toLowerCase();
            });
          }),
          EvaluatorUtil.makeEvaluator(function(val) {
            return val.toUpperCase();
          })
        ],
        scopePaths: paths
      });

      chai.expect(target.y).to.equal('MY-SQL');

      scope.set('x', 'iHaveADream');
      chai.expect(target.y).to.equal('I-HAVE-A-DREAM');

      Binding.clean(binding);
    });

    it('one-way binding on given event', function() {
      var target = {};
      var scope = new Exact.Store({x:1});
      var paths = ['x'];
      paths.flags = [1];

      var binding =  Binding.build(target, 'y', scope, {
        mode: 1,
        evaluator: EvaluatorUtil.makeGetEvaluator(paths),
        scopeEvent: 'update',
        scopePaths: paths
      });

      chai.expect(target.y).to.equal(scope.x);

      scope.set('x', 2);
      chai.expect(target.y).to.equal(1);
      chai.expect(target.y).to.not.equal(scope.x);

      scope.x = 3;
      chai.expect(target.y).to.equal(1);
      chai.expect(target.y).to.not.equal(scope.x);

      scope.send('update');
      chai.expect(target.y).to.equal(scope.x).to.equal(3);

      Binding.clean(binding);

      scope.set('x', 4);
      scope.send('update');
      chai.expect(target.y).to.equal(3);
      chai.expect(target.y).to.not.equal(scope.x);
    });

    it('one-way binding on multi-paths', function() {
      var target = {};
      var scope = new Exact.Store({x:1, y:2, a: new Exact.Store({b: 3})});
      var paths = ['x', 'y', 'a.b'];
      paths.flags = [1,1,1];

      var binding =  Binding.build(target, 'z', scope, {
        mode: 1,
        evaluator: EvaluatorUtil.makeEvaluator(function(x,y,ab) {
          return x+y+ab;
        }, paths),
        scopePaths: paths
      });

      chai.expect(target.z).to.equal(6);

      scope.set('x', 2);
      chai.expect(target.z).to.equal(7);

      scope.set('y', 3);
      chai.expect(target.z).to.equal(8);

      scope.a.set('b', 4);
      chai.expect(target.z).to.equal(9);

      Binding.clean(binding);
    });


    it('two-way binding ', function() {
      var target = new Exact.Store({y:0});
      var scope = new Exact.Store({x:1});
      var paths = ['x'];
      paths.flags = [1];

      var binding =  Binding.build(target, 'y', scope, {
        mode: 2,
        //evaluator: EvaluatorUtil.makeGetEvaluator(paths),
        scopePaths: paths
      });

      chai.expect(target.y).to.equal(scope.x);

      scope.set('x', 2);
      chai.expect(target.y).to.equal(scope.x);

      target.set('y', 3);
      chai.expect(target.y).to.equal(scope.x);
      //console.log(scope.x, target.y);

      Binding.clean(binding);

      scope.set('x', 4);
      chai.expect(target.y).to.equal(3);
      chai.expect(target.y).to.not.equal(scope.x);

      target.set('y', 5);
      chai.expect(scope.x).to.equal(4);
      chai.expect(scope.x).to.not.equal(target.y);
    });

    it('two-way binding with converters', function() {
      var target = new Exact.Store({y:'0'});
      var scope = new Exact.Store({x:1});
      var paths = ['x'];
      //paths.flags = [1];

      var binding =  Binding.build(target, 'y', scope, {
        mode: 2,
        //evaluator: EvaluatorUtil.makeGetEvaluator(paths),
        converters: [EvaluatorUtil.makeEvaluator(String, null, Number)],
        scopePaths: paths
      });

      chai.expect(target.y).to.equal('1');

      scope.set('x', 2);
      chai.expect(target.y).to.equal('2');

      target.set('y', '3');
      chai.expect(scope.x).to.equal(3);

      target.set('y', 'w3');
      chai.expect(scope.x).to.be.NaN;
      //console.log(scope.x, target.y);

      Binding.clean(binding);
    });

    it('two-way binding on path', function() {
      var target = new Exact.Store({y:0});
      var scope = {a: new Exact.Store({x:1})};
      var paths = ['a.x'];
      //paths.flags = [1];

      var binding =  Binding.build(target, 'y', scope, {
        mode: 2,
        //evaluator: EvaluatorUtil.makeGetEvaluator(paths),
        converters: [],
        scopePaths: paths
      });

      chai.expect(target.y).to.equal(1);

      scope.a.set('x', 2);
      chai.expect(target.y).to.equal(2);

      target.set('y', 3);
      chai.expect(scope.a.x).to.equal(3);
      //console.log(scope.x, target.y);

      Binding.clean(binding);
    });
  });
});
