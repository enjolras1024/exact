//Exact.ObjectUtil.namespace('a.b.c');

describe('core/template/HTMXTemplate', function() {
  var HTMXTemplate = Exact.HTMXTemplate;

  describe('constructor', function() {

    it('initial properties', function() {
      var template = new HTMXTemplate(true);

      chai.expect(template.ns).to.equal('');
      chai.expect(template.tag).to.equal('');
      chai.expect(template.ref).to.equal('');
      chai.expect(template.type).to.equal(null);
      chai.expect(template.props).to.equal(null);
      chai.expect(template.attrs).to.equal(null);
      chai.expect(template.style).to.equal(null);
      chai.expect(template.classes).to.equal(null);
      chai.expect(template.actions).to.equal(null);
      chai.expect(template.directs).to.equal(null);
      chai.expect(template.children).to.equal(null);
      chai.expect(template.virtual).to.equal(true);
    });

  });

  describe('HTMXTemplate.create', function() {
    it('only tag', function() {
      var template = HTMXTemplate.create('div');
      chai.expect(template.tag).to.equal('div');
      chai.expect(template.type).to.equal(null);
      chai.expect(template.virtual).to.equal(false);
    });

    it('only type', function() {
      var T = function() {};
      var template = HTMXTemplate.create(T);
      chai.expect(template.tag).to.equal('');
      chai.expect(template.type).to.equal(T);
      chai.expect(template.virtual).to.equal(false);
    });


    it('only child', function() {
      var span = document.createElement('span');
      chai.expect(HTMXTemplate.create('div', null, span).children).to.deep.equal([span]);
      chai.expect(HTMXTemplate.create('div', null, '123').children).to.deep.equal(['123']);
    });

    it('some params', function() {
      var attrs = {'data-code': 123},
        style = {color: 'red'},
        classes = {a: true, b: true},
        directs = {'x-if': null},
        actions = {click: null};

      var template = HTMXTemplate.create('input', {
        ns: 'x',
        ref: 'textBox',
        type: 'text',
        attrs: attrs,
        style: style,
        classes: classes,
        directs: directs,
        actions: actions
      });

      chai.expect(template.ns).to.equal('x');
      chai.expect(template.tag).to.equal('input');
      chai.expect(template.ref).to.equal('textBox');
      chai.expect(template.type).to.equal(null);
      chai.expect(template.attrs).to.equal(attrs);
      chai.expect(template.style).to.equal(style);
      chai.expect(template.actions).to.equal(actions);
      chai.expect(template.classes).to.equal(classes);
      chai.expect(template.directs).to.equal(directs);
      chai.expect(template.props.type).to.equal('text');
      //chai.expect(template.children).to.equal(null);
      chai.expect(template.virtual).to.equal(false);
    });

    it('some children', function() {
      var span = document.createElement('span');
      chai.expect(HTMXTemplate.create('div', null, [span, '123']).children).to.deep.equal([span, '123']);
    });
  });
});

