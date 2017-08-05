describe('base/Accessor', function() {
  var Accessor = Exact.Accessor;

  describe('extends Accessor', function() {
    it('Accessor is abstract class', function() {
      var error;
      try {
        new Accessor();
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.be.instanceOf(Error);
    });

    it('`get` and `set` must be implemented by sub-class', function() {
      function Foo() {}

      Exact.defineClass({
        constructor: Foo, extend: Accessor
      });

      var foo = new Foo(), error = null;

      try {
        foo.get('x');
      } catch(e) {
        error = e;
      }
      chai.expect(error).to.be.instanceOf(Error);

      error = null;

      try {
        foo.set('x');
      } catch(e) {
        error = e;
      }
      chai.expect(error).to.be.instanceOf(Error);
    });
  });

  function Foo() {
    this._props = {};
  }

  Exact.defineClass({
    constructor: Foo, extend: Accessor,
    get: function(key) {
      return this._props[key];
    },
    set: function(key, value) {
      this._props[key] = value;
    }
  });

  describe('Accessor.define', function() {
    it('define getter and setter', function() {
      Accessor.define(Foo.prototype, 'x');
      chai.expect(Object.getOwnPropertyDescriptor(Foo.prototype, 'x').get).not.equal(undefined);
      chai.expect(Object.getOwnPropertyDescriptor(Foo.prototype, 'x').set).not.equal(undefined);
    });
  });

  var foo = new Foo();

  describe('accessor.save', function() {
    it ('save properties', function() {
      foo.save({
        x: 1, y: 2
      });

      chai.expect(foo.x).to.equal(1);
      chai.expect(foo.y).to.equal(undefined);
      chai.expect(foo.get('y')).to.equal(2);
    });
  });

  describe('accessor.set', function() {
    it ('set a property', function() {
      foo.x = 3;
      chai.expect(foo.get('x')).to.equal(3);

      foo.set('x', 4);
      chai.expect(foo.x).to.equal(4);

      foo.y = 5;
      chai.expect(foo.get('y')).to.equal(2);

      foo.set('y', 6);
      chai.expect(foo.y).to.equal(5);
      chai.expect(foo.get('y')).to.equal(6);
    });
  });

  describe('accessor.unset', function() {
    it('unset a property', function() {
      foo.unset('x');
      chai.expect(foo.x).to.equal(undefined);
      chai.expect(foo.hasOwnProperty('x')).to.equal(false);

      foo.unset('y');
      chai.expect(foo.y).to.equal(undefined);
      chai.expect(foo.hasOwnProperty('y')).to.equal(false);
    });
  });


});