describe('core/models/Container', function() {
  var container;

  describe('Container.create', function() {
    it('create a container', function() {
      container = Exact.Container.create({x: 1});
      chai.expect(container.x).to.equal(1);
    });
  });

  describe('container.set', function() {
    it('setting may make container dirty', function() {
      var flag = false;
      container.onChange = function() {
        flag = true;
        chai.expect(container.x).to.equal(2);
      };

      container.set('x', 2);
      chai.expect(flag).to.equal(true);
    });
  });
});
