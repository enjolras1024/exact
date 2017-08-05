describe('base/Evaluator', function() {
  var Evaluator = Exact.Evaluator;

  describe('Evaluator.create', function() {
    it('create an evaluator', function() {
      var args = [];

      function exec() {}

      var evaluator = Evaluator.create(exec, args);

      chai.expect(evaluator.exec).to.equal(exec);
      chai.expect(evaluator.args).to.equal(args);
      chai.expect(evaluator.back).to.equal(undefined);

    });
  });

  describe('Evaluator.activate', function() {
    it('activate an evaluator without arguments', function() {
      var evaluator = Evaluator.create(function() { return 1;});
      chai.expect(Evaluator.activate(evaluator, 'exec')).to.equal(1);
    });

    it('activate an evaluator with literals as arguments', function() {
      var evaluator = Evaluator.create(function(a, b) { return a + b;}, [1, 2]);
      chai.expect(Evaluator.activate(evaluator, 'exec')).to.equal(3);
    });

    it('activate an evaluator with path and evaluator as arguments', function() {
      var path1 = ['b'];
      path1.origin = 0;

      var path2 = ['c', 'd'];
      path2.origin = 0;

      var eval1 = {
        path: ['e', 'f']
      };
      eval1.path.origin = 0;

      var eval2 = {
        path: ['g'],
        args: [1, 2]
      };
      eval2.path.origin = 0;

      var args = [1, path1, path2, eval1, eval2];
      args.flags = [0, 1, 1, -1, -1];

      var evaluator = Evaluator.create(function(a, b, c, d, e) { return a + b * c + d + e;}, args);

      chai.expect(Evaluator.activate(
        evaluator, 'exec',
        [
          {
            b: 2,
            c: {
              d: 3
            },
            e : {
              f: function() {
                return 4;
              }
            },
            g: function(a, b) {
              return a + b;
            }
          }
        ])
      ).to.equal(14);
    });

    it('activate a converter in two-way', function() {
      function exec(value, item) {
        return value + item.x;
      }

      function back(value, item) {
        return value - item.x;
      }

      var item = {x: 1};

      var path = [];
      path.origin = 0;

      var args = [
        path
      ];
      args.flags = [1];

      var converter = Evaluator.create(exec, args, back);

      chai.expect(
        Evaluator.activate(
          converter,
          'exec',
          [item],
          3
        )
      ).to.equal(4);

      chai.expect(
        Evaluator.activate(
          converter,
          'back',
          [item],
          4
        )
      ).to.equal(3);
    });
  });
});
