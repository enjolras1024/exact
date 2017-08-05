describe('core/template/parsers/HTMXParser', function() {
  describe('HTMXParser.parse', function() {
    var parse = Exact.HTMXParser.parse;
    var $ = Exact.HTMXTemplate.create;

    it('template must be DOM element or HTML string that contains a root tag', function() {
      var error;

      try {
        parse('123<span>123</span>');
      } catch (err) {
        error = err;
      }

      chai.expect(error).not.equal(undefined);

      chai.expect(parse($('div', null))).to.be.instanceOf(Exact.HTMXTemplate);
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
      var template = parse('<div><!--should be skipped--><input type="checkbox" title="title" checked><div full-name?="@{ $.firstName } @{ $.lastName }"></div></div>');
      chai.expect(template.children[0].props).to.deep.equal({type: 'checkbox', title: 'title', checked: true});
      chai.expect(template.children[1].props.expressions).to.have.all.keys('fullName');
    });

    it('parse events', function() {
      var template = parse('<img click+="$.refresh();" error+="$.onError">');
      chai.expect(template.actions.expressions).to.have.all.keys('click', 'error');
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

      chai.expect(template.children[0].directs.xIf.expression).to.be.instanceOf(Exact.Expression);
      chai.expect(template.children[0].directs.xFor.expression).to.be.instanceOf(Exact.Expression);
      chai.expect(template.children[0].directs.xKey.evaluator).to.be.instanceOf(Exact.Evaluator);

      template = parse('<div>...<x-slot name="content"></x-slot>...</div>');
      chai.expect(template.children[1].directs.xSlot).to.deep.equal({name: 'content'});
    });

    it('parse x-attrs, x-style, x-class', function() {
      var template = parse('<div class="a b" style="left: 0" x-style="top?:@{$.top}px; color&: $.color; font-size: 12px;" x-class="visible: true; active@: $.active;" x-attrs="data-id: 101; data-ip@: $.ip"></div>')

      chai.expect(template.attrs).to.deep.equal({'data-id': '101', style: 'left: 0'});
      chai.expect(template.attrs.expressions).to.have.all.keys('data-ip');
      chai.expect(template.style).to.deep.equal({fontSize: '12px'});
      chai.expect(template.style.expressions).to.have.all.keys('top', 'color');
      chai.expect(template.classes).to.deep.equal({visible: true, a: true, b: true});
      chai.expect(template.classes.expressions).to.have.all.keys('active');

      template = parse('<div style?="top:@{$.top}px; color: &{$.color}; font-size: 12px;" class?="visible @{ $.active ? \'active\' : \'\'}" x-attrs="data-id: 101; data-ip@: $.ip"></div>')
      chai.expect(template.attrs.expressions).to.have.all.keys('data-ip', 'class', 'style');
    });


    it('parse from a HTMXTemplate object directly', function() {
      var template = parse(
        $('div', {title: '...', className: 'a b', classes: {visible: true, 'active@': '$.active'}, style: {'top?': '@{$.top}px', 'color&': '$.color', 'fontSize': '12px'}}, [
          $('h2', null, '\&\{$.title\}'),
          $('span', null, 'abc123'),
          $('input', {type: 'checkbox', checked: true, actions:{change: null}, 'keyup+': '$.onKeyUp'})
        ])
      );

      chai.expect(template.props).to.deep.equal({title: '...'});
      chai.expect(template.style).to.deep.equal({fontSize: '12px'});
      chai.expect(template.style.expressions).to.have.all.keys('top', 'color');
      chai.expect(template.classes).to.deep.equal({visible: true, a: true, b: true});
      chai.expect(template.classes.expressions).to.have.all.keys('active');
      chai.expect(template.children[0].children[0]).to.be.instanceOf(Exact.Expression);
      chai.expect(template.children[0].children[0].compiler).to.equal(Exact.TextBinding);
      chai.expect(template.children[1].children[0]).to.equal('abc123');
      chai.expect(template.children[2].props).to.deep.equal({type: 'checkbox', checked: true});
      chai.expect(template.children[2].actions).to.deep.equal({change: null});
      chai.expect(template.children[2].actions.expressions).to.have.all.keys('keyup');
    });
  });
});