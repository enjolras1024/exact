//Exact.ObjectUtil.namespace('a.b.c');

describe('utils/EvaluatorUtil', function() {
  var EvaluatorUtil = Exact.EvaluatorUtil;

  describe('EvaluatorUtil.makeEvaluator', function() {
    it('Make an evaluator that returns the sum (all arguments are literals)', function() {
      var args = [1, 2, 3];

      var sum = function() {
        var res = 0;
        for (var i = 0, n = arguments.length; i < n; ++i) {
          res += arguments[i];
        }
        return res;
      };

      var evaluator = EvaluatorUtil.makeEvaluator(sum, args);

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec')).to.equal(6);
    });

    it('Make an evaluator that returns the full name (all arguments are paths)', function() {
      var args = ['firstName', 'lastName'];
      args.flags = [1 ,1];

      var getFullName = function(firstName, lastName) {
        return firstName + ' ' + lastName;
      };

      var scope = {
        firstName: 'Michael', lastName: 'Jordan'
      };

      var evaluator = EvaluatorUtil.makeEvaluator(getFullName, args);

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope)).to.equal('Michael Jordan');

      scope.lastName = 'Jackson';
      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope)).to.equal('Michael Jackson');
    });

    it('Make an evaluator that uses another evaluator as an argument', function() {
      var ha = EvaluatorUtil.makeEvaluator(function() {
        return 'ha';
      });

      var args = ['hi', 'ho', ha];
      args.flags = [0, 1 ,2];

      var link = function(a, b, c) {
        return a + ' ' + b + ' ' + c;
      };

      var scope = {
        ho: 'ho'
      };

      var evaluator = EvaluatorUtil.makeEvaluator(link, args);

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope)).to.equal('hi ho ha');
    });
  });

  describe('EvaluatorUtil.makeGetEvaluator', function() {
    it('Make a getter that returns the last literal argument', function() {
      var scope = {
        position: {
          x: 3, y: 3
        }
      };

      var args = [1, 2, 'position.x'];

      var getter = EvaluatorUtil.makeGetEvaluator(args);

      chai.expect(EvaluatorUtil.applyEvaluator(getter, 'exec', scope)).to.equal('position.x');
    });

    it('Make a getter that returns the last variable argument', function() {
      var scope = {
        position: {
          x: 3, y: 3
        }
      };

      var args = [1, 2, 'position.x'];
      args.flags = [0, 0, 1];

      var getter = EvaluatorUtil.makeGetEvaluator(args);

      chai.expect(EvaluatorUtil.applyEvaluator(getter, 'exec', scope)).to.equal(3);

      scope.position.x++;
      chai.expect(EvaluatorUtil.applyEvaluator(getter, 'exec', scope)).to.equal(4);
    });
  });

  describe('EvaluatorUtil.makeNotEvaluator', function() {
    it('Make a reverser', function() {
      var scope = {
        isInvalid: false
      };

      var args = ['isInvalid'];
      args.flags= [1];

      var not = EvaluatorUtil.makeNotEvaluator(args);

      chai.expect(EvaluatorUtil.applyEvaluator(not, 'exec', scope)).to.equal(true);

      scope.isInvalid = true;
      chai.expect(EvaluatorUtil.applyEvaluator(not, 'exec', scope)).to.equal(false);
    });
  });

  describe('EvaluatorUtil.makeExpressionEvaluator', function() {
    it('Make a expression evaluator', function() {
      var scope = {
        num: 50
      };

      var evaluator = EvaluatorUtil.makeExpressionEvaluator('$.num <= 100 ? $.num : 100');

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope)).to.equal(50);

      scope.num = 120;

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope)).to.equal(100);
    });
    it('Make a expression evaluator that uses event as an argument', function() {
      var scope = {
        num: 50
      };

      var evaluator = EvaluatorUtil.makeExpressionEvaluator('event.data * $.num');

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope, {data: 2})).to.equal(100);

      scope.num = 120;

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope, {data: 1/2})).to.equal(60);
    });
  });

  describe('EvaluatorUtil.applyEvaluator', function() {
    it('Use an instance method of the scope', function() {
      var scope = {
        firstName: 'Michael', lastName: 'Jordan',
        getFullName: function() {
          return this.firstName + ' ' + this.lastName;
        }
      };

      var evaluator = EvaluatorUtil.makeEvaluator();
      evaluator.name = 'getFullName';

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope)).to.equal('Michael Jordan');

      scope.lastName = 'Jackson';

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope)).to.equal('Michael Jackson');
    });

    it('Use an one-way filter included in the scope', function() {

      var scope = {
        filters: {
          upper: function(str) {
            return str.toUpperCase();
          }
        }
      };

      var evaluator = EvaluatorUtil.makeEvaluator();
      evaluator.name = 'filters.upper';

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', scope, null, 'yes')).to.equal('YES');
    });

    it('Use a two-way filter with rest arguments', function() {
      var filter = {
        exec: function(str, sign) {
          return str.toUpperCase() + sign;
        },
        back: function(str, sign) {
          return str.toLowerCase() + sign;
        }
      };

      var evaluator = EvaluatorUtil.makeEvaluator(filter.exec, ['!'], filter.back);

      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'exec', null, null, 'yes')).to.equal('YES!');
      chai.expect(EvaluatorUtil.applyEvaluator(evaluator, 'back', null, null, 'YES')).to.equal('yes!');
    });
  });
});
