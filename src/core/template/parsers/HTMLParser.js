//######################################################################################################################
// src/core/template/parsers/HTMLParser.js
//######################################################################################################################
(function() {
  var RES = Exact.RES;
  //var Skin = ExactSkin || Exact.Skin;
  var HTMXTemplate = Exact.HTMXTemplate;

  var BINDING_OPERATORS = Exact.BINDING_OPERATORS;

  /* /[\&\@\#\+\?]/ */
  var BINDING_OPERATORS_REGEXP = new RegExp(
    '[\\' + BINDING_OPERATORS.ONE_TIME +
    '\\' + BINDING_OPERATORS.ONE_WAY +
    '\\' + BINDING_OPERATORS.TWO_WAY +
    '\\' + BINDING_OPERATORS.EVENT +
    '\\' + BINDING_OPERATORS.TEXT + ']'
  );

  function parseData(expr, camel) {
    var pieces = expr.split(/;/g), piece, data = {}, name, key, n, i, j;

    for (i = 0, n = pieces.length; i < n; ++i) {
      piece = pieces[i];

      j = piece.indexOf(':');

      if (j > 0 ) {
        expr = piece.slice(j + 1).trim();
        name = piece.slice(0, j).trim();

        key = camel ? Exact.Skin.toCamelCase(name) : name;

        data[key] = expr;
      }
    }

    return data;
  }

  function parseSelf(template, $template, resources) {
    var Skin = Exact.Skin;

    template.ns = Skin.getNameSpace($template);
    template.tag = Skin.getTagName($template);

    //var type = Exact.Skin.toCamelCase(template.tag);
    //template.type = RES.search(type[0].toUpperCase() + type.slice(1), resources);

    var $attrs = Skin.getAttrs($template);

    if (!$attrs) { return; }

    if ($attrs['x-attrs']) {
      template.attrs = parseData($attrs['x-attrs']);
      delete $attrs['x-attrs'];
    }

    if ($attrs['x-style']) {
      template.style = parseData($attrs['x-style'], true);
      delete $attrs['x-style'];
    }

    if ($attrs['x-class']) {
      template.classes = parseData($attrs['x-class'], true);
      delete $attrs['x-class'];
    }

    if ($attrs['x-type']) {
      //template.attrs = template.attrs || {};
      //template.attrs['x-ref'] = $attrs['x-type'];

      template.type = RES.search($attrs['x-type'], resources);

      if (!template.type) {
        throw new TypeError('can not find such type `' + $attrs['x-type'] + '`');
      }

      delete $attrs['x-type'];
    }

    if ($attrs['x-ref']) {
      template.ref = $attrs['x-ref'];
      delete  $attrs['x-ref'];

      //template.attrs = template.attrs || {};
      //template.attrs['x-ref'] = template.ref;
    }

    var directs = {}, flag;

    if ($attrs['x-if']) {
      directs.xIf = $attrs['x-if'];
      delete $attrs['x-if'];
      flag = true;
    }

    if ($attrs['x-for']) {
      directs.xFor = $attrs['x-for'];
      delete $attrs['x-for'];
      flag = true;
    }

    if ($attrs['x-key']) {
      directs.xKey = $attrs['x-key'];
      delete $attrs['x-key'];
      flag = true;
    }

    if (flag) {
      template.directs = directs;
    }

    // props and events
    var props = {}, name, key, operator;

    for (name in $attrs) {
      if ($attrs.hasOwnProperty(name)) {
        operator = name[name.length - 1];
        if (BINDING_OPERATORS_REGEXP.test(operator)) {
          key = Skin.toCamelCase(name.slice(0, name.length - 1)) + operator;
        } else {
          key = Skin.toCamelCase(name);
        }

        props[key] = $attrs[name];
      }
    }

    template.props = props;
  }

  function parseChildren(template, $template, resources) {
    var Skin = Exact.Skin;

    var $children = Skin.getChildren($template);

    var $child, children = [], i, n;

    for (i = 0,  n = $children.length; i < n; ++i) {
      $child = $children[i];

      if (Skin.isComment($child)) { continue; }

      if (Skin.isElement($child)) {
        var child = new HTMXTemplate(true);

        parseSelf(child, $child, resources);
        parseChildren(child, $child, resources);

        children.push(child);
      } else if (Skin.isText($child)) {
        children.push(Skin.getProp($child, 'data'));
      }
    }

    if (children.length) {
      template.children = children;
    }
  }

  /**
   *
   * @param {HTMLElement|string} $template
   * @param {Object} resources
   * @returns {HTMXTemplate}
   */
  function parse($template, resources) {
    var Skin = Exact.Skin;
    resources = resources || {};

    if (typeof $template === 'string') {
      $template = Skin.parse($template.trim())[0];
    }

    if (!Skin.isElement($template)) {
      throw new TypeError('template must be DOM element or HTML string that contains a root tag');
    }

    var template = new HTMXTemplate(true);

    parseSelf(template, $template, resources);

    parseChildren(template, $template, resources);

    return template;
  }

  Exact.HTMLParser = {
    parse: parse
  };

  //Exact.HTMXTemplate.parse = parse;

})();