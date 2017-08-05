describe('core/template/parsers/HTMLParser', function() {
  describe('HTMLParser.parse', function() {
    var parse = Exact.HTMLParser.parse;


    it('template must be DOM element or HTML string or HTMLTemplate that contains a root tag', function() {
      var error;

      try {
        parse('123<span>123</span>');
      } catch (err) {
        error = err;
      }

      chai.expect(error).not.equal(undefined);

      chai.expect(parse('<div></div>')).to.be.instanceOf(Exact.HTMXTemplate);
      chai.expect(parse(document.createElement('div'))).to.be.instanceOf(Exact.HTMXTemplate);
    });

    it('parse tag and ns', function() {
      var template;

      template = parse('<div></div>');
      chai.expect(template.ns).to.equal('');
      chai.expect(template.tag).to.equal('div');
      chai.expect(template.type).to.equal(null);

      template = parse('<rect xmlns="http://www.w3.org/2000/svg"></rect>');
      chai.expect(template.ns).to.equal('svg');
      chai.expect(template.tag).to.equal('rect');
      chai.expect(template.type).to.equal(null);

      var resources = {
        Button: function() {}
      };

      template = parse('<x-button>OK</x-button>', resources);
      chai.expect(template.ns).to.equal('');
      chai.expect(template.tag).to.equal('x-button');
      chai.expect(template.type).to.equal(resources.Button);

      template = parse('<x-btn x-type="Button">OK</x-btn>', resources);
      chai.expect(template.ns).to.equal('');
      chai.expect(template.tag).to.equal('x-btn');
      chai.expect(template.type).to.equal(resources.Button);
    });

    it('parse props', function() {
      var template = parse('<div><!--should be skipped--><input title="title" checked><div full-name?="@{ $.firstName } @{ $.lastName }"></div></div>');
      chai.expect(template.children[0].props).to.deep.equal({title: 'title', checked: 'true'});
      chai.expect(template.children[1].props).to.deep.equal({'fullName?': '@{ $.firstName } @{ $.lastName }'});
    });

    it('parse children', function() {
      var template = parse('<div><h1>h1</h1>...<p>p</p></div>');
      chai.expect(template.children[0].tag).to.equal('h1');
      chai.expect(template.children[1]).to.equal('...');
      chai.expect(template.children[2].tag).to.equal('p');
    });

    it('parse x-ref', function() {
      var template = parse('<div><a x-ref="link"></a></div>');
      chai.expect(template.children[0].ref).to.equal('link');
    });

    it('parse x-type', function() {
      var resources = {
        Button: function() {},
        EUI: {
          Button: function() {}
        }
      };

      var template = parse('<div><a x-type="Button">Ok</a><a x-type="EUI.Button">Ok</a></div>', resources);

      chai.expect(template.children[0].type).to.equal(resources.Button);
      chai.expect(template.children[1].type).to.equal(resources.EUI.Button);

      var error;
      try {
        parse('<div><a x-type="Button">Ok</a></div>', {});
      } catch (err) {
        error = err;
      }
      chai.expect(error).not.equal(undefined);
    });

    it('parse x-if, x-for, x-key', function() {
      var template = parse('<ul><li x-if="$.active" x-for="item of $.items" x-key="item.id"></li></ul>');

      chai.expect(template.children[0].directs).to.deep.equal({
        xIf: '$.active', xFor: 'item of $.items', xKey: 'item.id'
      });
    });

    it('parse x-attrs, x-style, x-class', function() {
      var template = parse('<div x-style="color&: $.color; font-size: 12px;" x-class="visible: true; active@: $.active;" x-attrs="data-id: 101;"></div>')

      chai.expect(template.attrs).to.deep.equal({'data-id': '101'});
      chai.expect(template.style).to.deep.equal({fontSize: '12px', 'color&': '$.color'});
      chai.expect(template.classes).to.deep.equal({visible: 'true', 'active@': '$.active'});
    });


  });
});