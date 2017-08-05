describe('core/shadows/Element', function() {
  var Element = Exact.Element;

  describe('Element.create', function() {
    it('create an element shadow related to an element node', function(done) {

      var element = Element.create('div', '', {title: 'it\'s div'});

      chai.expect(element.props.title).to.equal('it\'s div');
      //chai.expect(element.props).to.be.not.instanceOf(Exact.Container);
      //
      //chai.expect(element.style).to.be.instanceOf(Exact.Container);
      //chai.expect(element.attrs).to.be.instanceOf(Exact.Container);
      //chai.expect(element.classes).to.be.instanceOf(Exact.Container);
      //chai.expect(element.children).to.be.instanceOf(Exact.Container);

      var error = null;
      try {
        element.attach(document.createElement('span'));
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.not.equal(null);

      error = null;
      try {
        element.attach(document.createElementNS('http://www.w3.org/2000/svg', 'div'));
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.not.equal(null);

      var node = document.createElement('div');
      element.attach(node);
      setTimeout(function() {
        chai.expect(element.$skin).to.equal(node);
        chai.expect(element.$skin.title).to.equal('it\'s div');
        done();
      }, 0);
    });

    //it('Element is final class can not be extended', function() {
    //  var error = null;
    //  function SVGElement() {
    //    Element.apply(this, arguments);
    //  }
    //  Exact.defineClass({
    //    constructor: SVGElement, extend: Element
    //  });
    //
    //  try {
    //    var svg = new SVGElement();
    //  } catch(err) {
    //    error = err;
    //  }
    //  chai.expect(error).to.not.equal(null);
    //  //chai.expect(error.message).to.eqaul('Element is final class and can not be extended');
    //});
  });

  describe('element.props', function() {
    it('element.set prop or element.save props', function(done) {

      var element = Element.create('input', '', {type: 'text'});

      chai.expect(element.props.type).to.equal('text');
      chai.expect(element.props).to.be.not.instanceOf(Exact.Container);

      chai.expect(element.props.title).to.equal(undefined);
      element.set('title', '...');
      chai.expect(element.props.title).to.equal('...');

      element.save({
        placeholder: '123',
        title: '456',
        value: '789'
      });
      chai.expect(element.props.placeholder).to.equal('123');
      chai.expect(element.props.title).to.equal('456');
      chai.expect(element.props.value).to.equal('789');


      var node = document.createElement('input');
      element.attach(node);
      setTimeout(function() {
        chai.expect(element.$skin).to.equal(node);
        chai.expect(element.$skin.placeholder).to.equal('123');
        chai.expect(element.$skin.title).to.equal('456');
        chai.expect(element.$skin.value).to.equal('789');
        done();
      }, 0);
    })
  });

  describe('other members of element', function() {
    it('element.style, element.attrs, element.classes', function(done) {

      var element = Element.create('div');

      chai.expect(element.style).to.be.instanceOf(Exact.Container);
      chai.expect(element.attrs).to.be.instanceOf(Exact.Container);
      chai.expect(element.classes).to.be.instanceOf(Exact.Container);

      element.style.save({
        color: 'blue',
        fontSize: '15px'
      });

      element.save({
        title: '...',
        'data-src': 'https://github.com/'
      });

      element.attrs.save({
        'title': 'github', // override
        'class': 'a b',
        'data-url': 'https://github.com/'
      });

      element.classes.save({
        a: false, // remove a
        c: true
      });

      var node = document.createElement('div');
      element.attach(node);
      setTimeout(function() {
        chai.expect(element.$skin).to.equal(node);
        chai.expect(element.$skin.title).to.equal('github');
        chai.expect(element.$skin.getAttribute('title')).to.equal('github');
        chai.expect(element.$skin.getAttribute('data-src')).to.equal('https://github.com/');
        chai.expect(element.$skin.getAttribute('data-url')).to.equal('https://github.com/');
        chai.expect(element.$skin.style.color).to.equal('blue');
        chai.expect(element.$skin.style.fontSize).to.equal('15px');
        chai.expect(element.$skin.className).to.equal('b c');
        done();
      }, 0);
    })
  });

  describe('children', function() {
    it('element.children insert, remove, replace...', function(done) {

      var element = Element.create('div');

      chai.expect(element.children).to.be.instanceOf(Exact.Collection);

      var a = Element.create('a'), p = Element.create('p'), span = Element.create('span')
      var text1 = Exact.Text.create('1'), text2 = Exact.Text.create('2');

      element.children.insert(a);
      element.children.insert(p, a);
      element.children.insert(span);
      element.children.insert(text1);
      element.children.replace(text2, text1);
      element.children.insert(span);
      element.children.remove(a);

      chai.expect(element.children.length).to.equal(3);
      chai.expect(element.children[0]).to.equal(p);
      chai.expect(element.children[1]).to.equal(text2);
      chai.expect(element.children[2]).to.equal(span);


      var node = document.createElement('div');
      element.attach(node);
      setTimeout(function() {
        chai.expect(element.$skin).to.equal(node);
        chai.expect(element.$skin.childNodes.length).to.equal(3);
        chai.expect(element.$skin.childNodes[0]).to.equal(p.$skin);
        chai.expect(element.$skin.childNodes[1]).to.equal(text2.$skin);
        chai.expect(element.$skin.childNodes[2]).to.equal(span.$skin);
        //done();
        element.children.remove(text2);

        setTimeout(function() {
          chai.expect(element.$skin).to.equal(node);
          chai.expect(element.$skin.childNodes.length).to.equal(2);
          chai.expect(element.$skin.childNodes[0]).to.equal(p.$skin);
          chai.expect(element.$skin.childNodes[1]).to.equal(span.$skin);
          done();
        }, 0);
      }, 0);
    });
  });
});
