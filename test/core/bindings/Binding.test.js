//Exact.ObjectUtil.namespace('a.b.c');

describe('core/bindings/Binding', function() {
  var Binding = Exact.Binding;

  describe('Binding.assign', function() {

    it('assign value to target with `set`', function() {
      var target = {
        props: {},
        set: function(key, val) {
          this.props[key] = val;
        }
      };

      Binding.assign(target, 'x', 1);
      chai.expect(target.props.x).to.equal(1);
    });

    it('assign value to target without `set`', function() {
      var target = {};

      Binding.assign(target, 'x', 1);
      chai.expect(target.x).to.equal(1);
    });
  });

  var target = {}, bnd0 = {}, bnd1 = {};

  describe('Binding.record', function() {

    it('record two bindings', function() {
      chai.expect(target._bindings).to.equal(undefined);

      Binding.record(target, bnd0);
      chai.expect(target._bindings[0]).to.equal(bnd0);

      Binding.record(target, bnd1);
      chai.expect(target._bindings[1]).to.equal(bnd1);
    });
  });

  describe('Binding.remove', function() {
    it('remove two bindings', function() {
      Binding.remove(target, bnd0);
      chai.expect(target._bindings[0]).not.equal(bnd0);

      Binding.remove(target, bnd1);
      chai.expect(target._bindings.length).to.equal(0);
    });
  });
});

