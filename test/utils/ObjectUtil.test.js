
describe('utils/ObjectUtil', function() {
  var ObjectUtil = Exact.ObjectUtil;

  describe('ObjectUtil.assign', function() {
    it('should throw error when we assign properties to null or undefined', function() {
      var obj;

      try {
        obj = ObjectUtil.assign(null, {x: 1, y: 2});
      } catch(error) {

      }

      chai.expect(obj).to.equal(undefined);

      try {
        obj = ObjectUtil.assign(undefined, {x: 1, y: 2});
      } catch(error) {

      }

      chai.expect(obj).to.equal(undefined);
    });


    it('should success when we assign the properties of sources to target', function() {
      var target = {x: 1, y: 2}, sources = [{y: 2.5, z: 3}, {z:4, w: 5}];

      ObjectUtil.assign(target, sources[0], sources[1]);

      chai.expect(target.x).to.equal(1);
      chai.expect(target.y).to.equal(2.5);
      chai.expect(target.z).to.equal(4);
      chai.expect(target.w).to.equal(5);
    });

    it('should convert boolean, number or string target to object', function() {
      var bool = ObjectUtil.assign(false, {value: false});
      chai.expect(bool).to.instanceOf(Boolean);
      chai.expect(bool.value).to.equal(false);
      chai.expect(bool.valueOf()).to.equal(false);

      var num = ObjectUtil.assign(0, {value: 0});
      chai.expect(num).to.instanceOf(Number);
      chai.expect(num.value).to.equal(0);
      chai.expect(num.valueOf()).to.equal(0);

      var str = ObjectUtil.assign('', {value: ''});
      chai.expect(str).to.instanceOf(String);
      chai.expect(str.value).to.equal('');
      chai.expect(str.valueOf()).to.equal('');
    });

    it('should ignore boolean, number or string sources', function() {
      var target = {x: 1, y: 2}, sources = [{y: 2.5, z: 3}, {z:4, w: 5}];

      ObjectUtil.assign(target, false, sources[0], 0, sources[1], '');

      chai.expect(target.x).to.equal(1);
      chai.expect(target.y).to.equal(2.5);
      chai.expect(target.z).to.equal(4);
      chai.expect(target.w).to.equal(5);
    });
  });

  describe('ObjectUtil.clone', function() {
    var obj1 = {
      a: 1, b : [2, 3], c: {
        a: 4, b : [5, 6]
      },
      f: function() {
        return 7;
      }
    };

    it('Clone an object fully', function() {
      var obj2 = ObjectUtil.clone(obj1);

      chai.expect(obj2).not.equal(obj1);
      chai.expect(obj2.a).to.equal(obj1.a);
      chai.expect(obj2.b).to.not.equal(obj1.b);
      chai.expect(obj2.b).to.deep.equal(obj1.b);
      chai.expect(obj2.c).to.not.equal(obj1.c);
      chai.expect(obj2.c).to.deep.equal(obj1.c);
      chai.expect(obj2.f).not.equal(obj1.f);
      chai.expect(obj2.f()).to.equal(obj1.f());
    });

    it('Clone an object deeply but not fully', function() {
      var obj2 = ObjectUtil.clone(obj1, 2);

      chai.expect(obj2).not.equal(obj1);
      chai.expect(obj2.a).to.equal(obj1.a);
      chai.expect(obj2.b).to.not.equal(obj1.b);
      chai.expect(obj2.b).to.deep.equal(obj1.b);
      chai.expect(obj2.c).to.not.equal(obj1.c);
      chai.expect(obj2.c.b).to.equal(obj1.c.b);
      chai.expect(obj2.f).not.equal(obj1.f);
      chai.expect(obj2.f()).to.equal(obj1.f());
    });

    it('Refer to an object', function() {
      var obj2 = ObjectUtil.clone(obj1, 0);

      chai.expect(obj2).to.equal(obj1);
      chai.expect(obj2.a).to.equal(obj1.a);
      chai.expect(obj2.b).to.equal(obj1.b);
      chai.expect(obj2.c).to.equal(obj1.c);
      chai.expect(obj2.f).to.equal(obj1.f);
    });
  });

  describe('ObjectUtil.update', function() {
    var obj1 = {
      a: 1, b : [2, 3], c: {
        a: 1, b : [5, 6, 7], c: {}
      },
      d: [8, 9, 10],
      e: {}
    };

    it('Update an object and return new one', function() {
      var obj2 = ObjectUtil.update(obj1, {
        a: {$set: 0}, b: {$push: [4, 5]},
        c : {
          a: {$apply: function(a) {
            return ++a;
          }},
          b: {$splice: [1, 1, 5.5, 6.5]}
        },
        d: {$unshift: [7.5]},
        $assign: {
          f: function() {
            return 7;
          }
        }
      });

      chai.expect(obj2).not.equal(obj1);
      chai.expect(obj2.a).to.equal(0);
      chai.expect(obj2.b).to.not.equal(obj1.b);
      chai.expect(obj2.b).to.deep.equal([2,3,4,5]);
      chai.expect(obj2.c).to.not.equal(obj1.c);
      chai.expect(obj2.c.a).to.equal(2);
      chai.expect(obj2.c.b).to.not.equal(obj1.c.b);
      chai.expect(obj2.c.b).to.deep.equal([5,5.5,6.5,7]);
      chai.expect(obj2.c.c).to.equal(obj1.c.c);
      chai.expect(obj2.d).to.not.equal(obj1.d);
      chai.expect(obj2.d).to.deep.equal([7.5, 8, 9, 10]);
      chai.expect(obj2.e).to.equal(obj1.e);
      chai.expect(obj1.f).to.equal(undefined);
      chai.expect(obj2.f()).to.equal(7);
    });
  });

//  describe('ObjectUtil.namespace', function() {
//    it('Get or create namespace', function() {
//      var a = {};
//      ObjectUtil.namespace('b.c', a);
//
//      chai.expect(window.a.b.c).to.be.an('object');
//      chai.expect(a.b.c).to.be.an('object');
//      chai.expect(ObjectUtil.namespace('a.b')).to.be.an('object')
//        .and.equal(ObjectUtil.namespace('a.b', window));
//      chai.expect(ObjectUtil.namespace('b', a)).to.be.an('object');
//    });
//  });
});

//Exact.ObjectUtil.namespace('a.b.c');
//console.log(a);