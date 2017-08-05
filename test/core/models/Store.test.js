describe('core/models/Store', function() {
  var Store = Exact.Store;

  describe('Store.create', function() {
    it('auto create getter and setter', function() {
      var store = Store.create({x: 1});

      chai.expect(store.x).to.equal(1);

      var flag = false;
      store.on('changed', function(event) {
        flag = true;
      });

      store.x = 1;
      chai.expect(store.get('x')).to.equal(1);
      chai.expect(flag).to.equal(false);

      store.x = 2;
      chai.expect(store.get('x')).to.equal(2);
      chai.expect(flag).to.equal(true);
    })
  });

  describe('store.set', function() {
    it('setting a property will create getter and setter', function() {
      var store = Store.create();

      store.x = 1;

      var flag = false;
      store.on('changed', function(event) {
        flag = true;
      });

      chai.expect(store.get('x')).to.equal(undefined);

      store.set('x', 1);
      chai.expect(store.get('x')).to.equal(1);
      chai.expect(flag).to.equal(true);

      store.x = 2;
      chai.expect(store.get('x')).to.equal(2);

      flag = false;
      store.x = 2;
      chai.expect(flag).to.equal(false);
    });
  });
});
