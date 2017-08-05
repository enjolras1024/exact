describe('core/shadows/Shadow', function() {
  var Skin = Exact.Skin;
  var Shadow = Exact.Shadow;
  var Element = Exact.Element;
  var Component = Exact.Component;

  describe('Shadow constructor', function() {
    it('Shadow is abstract and can not be instantiated', function() {
      var error = null;
      try {
        var shadow = new Shadow();
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.not.equal(null);
    });
  });

  describe('shadow.attach & shadow.detach', function() {
    it('a shadow can not attach a $skin that has a different tag', function() {
      var ul = Element.create('ul');
      var error = null;
      try {
        ul.attach(document.createElement('ol'));
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.not.equal(null);
    });

    it('a shadow can not attach a $skin that has a different namespace', function() {
      var rect = Element.create('rect');
      var error = null;
      try {
        rect.attach(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.not.equal(null);
    });

    var div = Element.create('div');
    var $div = document.createElement('div');
    var isClicked = 0, hasAttached = 0;

    it('add event listeners and invalidate after attaching $skin', function() {
           chai.expect(div.isInvalidated ).to.not.equal(true);

      div.on('click', function() {
        isClicked++;
      });
      div.on('attached', function() {
        hasAttached++;
      });

      div.attach($div);

      var event = document.createEvent("MouseEvents");
      event.initEvent("click",true,true);
      $div.dispatchEvent(event);

      chai.expect(isClicked).to.equal(1);
      chai.expect(hasAttached).to.equal(1);
      chai.expect(div.$skin).to.equal($div);
      chai.expect($div._shadow).to.equal(div);
      chai.expect(div.isInvalidated ).to.equal(true);
    });

    it('a shadow can not attach a $skin that has been attached', function() {
    div.attach($div);
      chai.expect(hasAttached).to.equal(1);

      var div2 = Element.create('div');
      var $div2 = document.createElement('div');

      div2.attach($div2);

      var error = null;
      try {
        div.attach($div2);
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.not.equal(null);
      chai.expect($div._shadow).to.equal(div);
    });

    it('remove event listeners after detaching $skin', function() {
      div.on('detached', function() {
        hasAttached = 0;
      });

      div.detach($div);

      var event = document.createEvent("MouseEvents");
      event.initEvent("click",true,true);
      $div.dispatchEvent(event);

      chai.expect(isClicked).to.equal(1);
      chai.expect(hasAttached).to.equal(0);
      chai.expect(div.$skin == null).to.equal(true);
      chai.expect($div._shadow == null).to.equal(true);
    });

  });

  function Demo() {
    Component.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Demo, extend: Component,
    statics: {
      template: '<div><input type="text" x-ref="input" value@="$.value" change+="$.onChange"></div>'
    },
    onChange: function() {},
    refresh: function() {
      this.isRefreshed = true;
    },
    release: function() {
      this.isReleased = true;
    }
  });

  var demo = new Demo();

  describe('shadow.invalidate & shadow.update & shadow.refresh', function() {
    it('update and refresh shadow after invalidating', function(done) {

      demo.isRefreshed = false;
      demo.isInvalidated = false;
      //console.log(demo.isRefreshed,demo.isInvalidated);
      demo.update();
      //console.log(demo.isRefreshed,demo.isInvalidated);
      chai.expect(demo.isRefreshed).to.not.equal(true);
      chai.expect(demo.isInvalidated).to.not.equal(true);

      demo.invalidate();
      chai.expect(demo.isInvalidated ).to.equal(true);
      setTimeout(function() {
        chai.expect(demo.isRefreshed).to.equal(true);
        chai.expect(demo.isInvalidated ).to.not.equal(true);
        done();
      }, 0);
    });
  });

  describe('Shadow.destroy', function() {
    it('shadow.off, shadow.release, remove bindings and destroy children', function() {
      demo.on('click', function() {});

      chai.expect(demo._actions['click']).to.not.equal(undefined);
      chai.expect(demo.isReleased).to.not.equal(true);
      chai.expect(demo.input._actions['change']).to.not.equal(undefined);
      chai.expect(demo.input._bindings.length).to.equal(1);

      Shadow.destroy(demo);

      chai.expect(demo._actions['click']).to.equal(undefined);
      chai.expect(demo.isReleased).to.equal(true);
      chai.expect(demo.input._actions['change']).to.equal(undefined);
      chai.expect(demo.input._bindings).to.equal(undefined);

    });
  });

  //describe('shadow.focus & shadow.blur', function() {
  //
  //});

});
