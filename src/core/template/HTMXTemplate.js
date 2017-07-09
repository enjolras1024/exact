//######################################################################################################################
// src/core/templates/HTMXTemplate.js
//######################################################################################################################
(function() {

  var TEMPLATE_BASE = {
    ns: '',
    tag: '',
    ref: '',
    //type: null,
    props: null,
    attrs: null,
    style: null,
    classes: null,
    actions: null,
    directs: null,
    children: null
  };

  function HTMXTemplate(virtual) {

    //this.ns = '';
    //this.tag = '';
    //this.type = null;
    //
    ////this.key = '';
    //this.ref = '';
    //
    //this.props = null;
    //this.attrs = null;
    //this.style = null;
    //this.classes = null;
    //this.actions = null;
    //this.directs = null;
    //this.children = null;
    //
    Exact.assign(this, TEMPLATE_BASE);
    this.virtual = virtual; // if prop value is virtual or actual
    this.type = null;
  }

  /**
   * e.g. create('div', null, [
   *        create('h1', null, 'title'),
   *        create('ul', null,
   *          create('a', {
   *              'href@': 'link.url',
   *              classes: {link: true, 'active@': 'link.active'},
   *              directs: {'for': 'link of $.links', key: 'link.url'}
   *            },
   *            ['tip: @{ link.tip }']
   *          )
   *        ),
   *        create(Button, { label: 'OK', 'click+': '$.onClick' })
   *      ])
   *
   * @param {string|Function} tagOrType
   * @param {Object} params
   * @param {string|Array|HTMXTemplate} children
   * @returns {HTMXTemplate}
   */
  function create(tagOrType, params, children) {
    var template = new HTMXTemplate(false);
    // if there is no expression for the prop, the value assigned to the prop must be actual, not virtual,
    // e.g. { score: 10 } instead of { score: '10' } if `score` is number
    //template.virtual = false;

    var t = typeof tagOrType;
    if (t === 'string') {
      template.tag = tagOrType;
    } else if (t === 'function') {
      template.type = tagOrType;
    } else {
      throw new TypeError('First argument must be string or constructor');
    }

    if (params) {
      if (!template.type) {
        template.ns = params.ns || '';
      }

      //template.key = params.key;    // not for string or DOM template
      //template.actions = params.on; // not for string or DOM template

      template.ref = params.ref;
      template.style = params.style;
      template.attrs = params.attrs;
      template.classes = params.classes;
      template.actions = params.actions;// || params.on;
      template.directs = params.directs;

      var props = template.props = {};

      for (var key in params) {
        if (params.hasOwnProperty(key) && !TEMPLATE_BASE.hasOwnProperty(key)) {
          props[key] = params[key];
        }
      }
    }

    if (children != null && !Array.isArray(children)) {
      children = [children];
    }

    template.children = children;

    return template;
  }

  HTMXTemplate.create = create;
  //HTMXTemplate.compile = null;
  //HTMXTemplate.parse = null;

  Exact.HTMXTemplate = HTMXTemplate;

})();