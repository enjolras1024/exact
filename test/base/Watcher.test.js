describe('base/Watcher', function() { //TODO: for element
  var watcher = new Exact.Watcher(), boundFunc;//, n = 0, m = 0, l = 0, i = 0;

  var count = {
    submit: 0,
    success: 0,
    error: 0,
//    update: 0,
//    warning: 0,
    invalid: 0,
    click: 0,
    'change': 0,
    'change.text': 0,
    'change.title': 0,
    'update.text': 0,
    'update.title': 0
  };

  watcher.onSuccess = function(data) {
//    l++;
    count['success']++;
    chai.expect(data).to.equal(1024);
  };

  watcher.onError = function() {
    count['error']++;
  };

  watcher.onSubmit = function() {
    count['submit']++;
  };

  watcher.onInvalid = function() {
    count['invalid']++;
  };

  watcher.onClick = function() {
    count['click']++;
  };

  watcher.onTextUpdate = function(event) {
    count['update.text']++;
    chai.expect(event.type).to.equal('change');
  };

  watcher.onTextChange = function(event) {
    count['change.text']++;
    chai.expect(event.type).to.equal('change');
  };

  watcher.onTitleUpdate = function(event) {
    count['update.title']++;
    chai.expect(event.type).to.equal('change');
  };

  watcher.onTitleChange = function(event) {
    count['change.title']++;
    chai.expect(event.type).to.equal('change');
  };

  watcher.onChange = (function(event, params) {
//    n++;
    count['change']++;
//    chai.expect(event.type).to.not.equal('*.change');

    chai.expect(this).to.equal(watcher);

    if (params) {
      chai.expect(params.title).to.equal('marvin');
    }
  }).bind(watcher);

  describe('watcher.on', function() {
    it('watcher.on(type, func)', function() {
      watcher.on('error', watcher.onError);
      watcher.on('submit', watcher.onSubmit);
      watcher.on('success', watcher.onSuccess);
      watcher.on('invalid', watcher.onInvalid);
    });

    it('watcher.on({type: func})', function() {
      watcher.on({
        //click: [watcher.onFinish, true],
        'change': watcher.onChange,
        'change.text': watcher.onTextChange,
        'change.title': watcher.onTitleChange
      });

      watcher.on({
        'change.text': watcher.onTextUpdate,
        'change.title': watcher.onTitleUpdate
      });
    });

    it('watcher.on that is already on', function() {
      watcher.on('change', watcher.onChange);
      watcher.on({
        'change.text': watcher.onTextUpdate
      });
    });
    
    it('watcher.once', function() {
      watcher.once({
        load: function() {},
        click: watcher.onClick
      });
    });
  });

  describe('watcher.send / watcher.emit', function() {
    it('watcher.send or watcher.emit without params', function() {
      watcher.emit('submit');
      chai.expect(count['submit']).to.equal(1);

      watcher.emit('error');
      chai.expect(count['error']).to.equal(1);

      watcher.send('click');
      chai.expect(watcher._actions).to.not.have.property('click');

      watcher.send('change.text');
//      chai.expect(count['*.change']).to.equal(1);
      chai.expect(count['change.text']).to.equal(1);
      chai.expect(count['update.text']).to.equal(1);
      chai.expect(count['change.title']).to.equal(0);
      chai.expect(count['update.title']).to.equal(0);
    });

    it('watcher.send or watcher.emit with given params', function() {
      watcher.emit('submit');
      chai.expect(count['submit']).to.equal(2);

      watcher.emit('success', 1024);
      chai.expect(count['success']).to.equal(1);

      watcher.send('change.title', {title: 'marvin'});
//      chai.expect(count['*.change']).to.equal(2);
      chai.expect(count['change.text']).to.equal(1);
      chai.expect(count['update.text']).to.equal(1);
      chai.expect(count['change.title']).to.equal(1);
      chai.expect(count['update.title']).to.equal(1);
    });
  });

  describe('watcher.off', function() {
    it('watcher.off(type, func)', function() {
      watcher.off('submit', watcher.onSubmit);
      watcher.off('invalid', watcher.onInvalid);

      chai.expect(watcher._actions).to.not.have.keys('submit', 'invalid');
    });

    it('watcher.off({type: func})', function() {
      watcher.off({
        'change.text': watcher.onTextUpdate,
        'change.title': watcher.onTitleUpdate
      });
      chai.expect(watcher._actions).to.include.keys('change');

      watcher.send('change.text');
      watcher.send('change.title');
//      chai.expect(count['*.change']).to.equal(4);
      chai.expect(count['change.text']).to.equal(2);
      chai.expect(count['update.text']).to.equal(1);
      chai.expect(count['change.title']).to.equal(2);
      chai.expect(count['update.title']).to.equal(1);
    });

    it('watcher.off(type)', function() {
      watcher.off('change.text');
      //chai.expect(watcher._actions).to.not.have.property('change');

      watcher.off('change.title');
      //chai.expect(watcher._actions).to.not.have.property('change');

      watcher.send('change.text');
      chai.expect(count['change.text']).to.equal(2);

      watcher.send('change.title');
      chai.expect(count['change.text']).to.equal(2);
    });

    it('watcher.off that does not exist', function() {
      watcher.off({
        click: watcher.onClick,
        'change.text': watcher.onTextChange
      });
    });

    it('watcher.off()', function() {
      chai.expect(watcher._actions).to.have.keys('success', 'error', 'change', 'load');
//      chai.expect(watcher._actions).to.be.not.empty;
      watcher.off();
      chai.expect(watcher._actions).to.be.empty;
    });
  });

});