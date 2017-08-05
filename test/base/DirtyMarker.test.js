//Exact.ObjectUtil.namespace('a.b.c');

describe('base/DirtyMarker', function() {
  var DirtyMarker = Exact.DirtyMarker;

  var instance = Exact.assign({x: 1, y: 2}, DirtyMarker.prototype);

  describe('DirtyMarker is abstract class', function() {
    var error;
    try {
      new DirtyMarker();
    } catch (e) {
      error = e;
    }
    chai.expect(error).to.be.instanceOf(Error);
  });

  describe('DirtyMarker.check', function() {

    it('Check a prop with new value', function() {
      DirtyMarker.check(instance, 'x', 2, instance.x);
      DirtyMarker.check(instance, 'y', 3, instance.y);
      chai.expect(instance.hasDirty('x')).to.equal(true);
      chai.expect(instance.hasDirty('y')).to.equal(true);
      chai.expect(instance.hasDirty('z')).to.equal(false);
    });

    it('Check a new prop', function() {
      DirtyMarker.check(instance, 'z', 4, instance.z);
      chai.expect(instance.hasDirty('x')).to.equal(true);
      chai.expect(instance.hasDirty('y')).to.equal(true);
      chai.expect(instance.hasDirty('z')).to.equal(true);
    });

    it('Check a prop with original value', function() {
      DirtyMarker.check(instance, 'x', 1, instance.x);
      chai.expect(instance.hasDirty('x')).to.equal(false);
      chai.expect(instance.hasDirty('y')).to.equal(true);
      chai.expect(instance.hasDirty('z')).to.equal(true);
    });
  });

  describe('DirtyMarker.clean', function() {
    it('Clean a prop', function() {
      DirtyMarker.clean(instance, 'y');
      chai.expect(instance.hasDirty('x')).to.equal(false);
      chai.expect(instance.hasDirty('y')).to.equal(false);
      chai.expect(instance.hasDirty('z')).to.equal(true);
    });

    it('Clean all props', function() {
      DirtyMarker.clean(instance);
      //chai.expect(instance._dirty).to.equal(undefined);
      chai.expect(instance.hasDirty('x')).to.equal(false);
      chai.expect(instance.hasDirty('y')).to.equal(false);
      chai.expect(instance.hasDirty('z')).to.equal(false);
    });
  });

  describe('checker.hasDirty', function() {
    it('Has dirty props', function() {
      chai.expect(instance.hasDirty()).to.equal(false);
      DirtyMarker.check(instance, 'x', 2, instance.x);
      chai.expect(instance.hasDirty()).to.equal(true);
    });

    it('Has named dirty prop', function() {
      chai.expect(instance.hasDirty('x')).to.equal(true);
      chai.expect(instance.hasDirty('y')).to.equal(false);
      chai.expect(instance.hasDirty('z')).to.equal(false);
    });
  });
});

