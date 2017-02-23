//######################################################################################################################
// src/core/templates/HTMXTemplate.js
//######################################################################################################################
(function() {

  function HTMXTemplate() {
    this.ns = '';
    this.tag = '';
    this.type = null;

    this.key = '';
    this.ref = '';

    this.props = null;
    this.attrs = null;
    this.style = null;
    this.classes = null;
    this.actions = null;
    this.directs = null;
    this.children = null;

    this.actual = false; // if prop value is actual
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
    var template = new HTMXTemplate();
    // if there is no expression for prop, the value assigned to the prop must be actual,
    // e.g. { score: 10 } instead of { score: '10' } if `score` is number
    template.actual = true;

    if (typeof tagOrType === 'string') {
      template.tag = tagOrType;
    } else if (typeof tagOrType === 'function') {
      template.type = tagOrType;
    } else {
      throw new TypeError('');
    }

    if (params) {
      if (!template.type) {
        template.ns = params.ns || '';
      }

      template.key = params.key;    // not for string or DOM template
      template.actions = params.on; // not for string or DOM template

      template.ref = params.ref;
      template.style = params.style;
      template.attrs = params.attrs;
      template.classes = params.classes;
      template.directs = params.directs;

      var props = template.props = {};

      for (var key in params) {
        if (params.hasOwnProperty(key) && !template.hasOwnProperty(key)) {
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
  //HTMXTemplate.parse = null;

  Exact.HTMXTemplate = HTMXTemplate;

})();