describe('core/shadows/Text', function() {
  var Text = Exact.Text;

  describe('Text.create', function() {
    it('create a text shadow related to a text node', function(done) {
      var text = Text.create('...');

      chai.expect(text.style).to.equal(undefined);
      chai.expect(text.attrs).to.equal(undefined);
      chai.expect(text.classes).to.equal(undefined);
      chai.expect(text.children).to.equal(undefined);
      chai.expect(Text.create('...').props.data).to.equal('...');

      var error;
      try {
        text.attach(document.createElement('span'));
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.not.equal(undefined);

      var node = document.createTextNode('');
      text.attach(node);
      setTimeout(function() {
        chai.expect(text.$skin).to.equal(node);
        chai.expect(text.$skin.data).to.equal('...');
        done();
      }, 0);
    })
  });

  describe('text.set', function() {
    it('set data, and render data util attaching a text node', function(done) {
      var text = Text.create('');
      text.set('data', '...');
      chai.expect(text.props.data).to.equal('...');

      setTimeout(function() {
        chai.expect(text.$skin).to.equal(undefined);

        var node = document.createTextNode('');
        text.attach(node);
        setTimeout(function() {
          chai.expect(text.$skin).to.equal(node);
          chai.expect(text.$skin.data).to.equal('...');
          done();
        }, 0);
      }, 0);
    });
  });

  //describe('text.toString', function() {
  //  it('', function() {
  //    var text = Text.create('0123456789');
  //
  //    chai.expect(Text.create('0123456789').toString().indexOf('0123456789') > 0).to.equal(true);
  //
  //  });
  //});
});
