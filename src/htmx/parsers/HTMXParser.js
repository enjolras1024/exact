//######################################################################################################################
// src/htmx/parsers/HTMXParser.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;
  var Skin = Exact.Skin;

  var ObjectUtil = Exact.ObjectUtil;
  var LiteralUtil = Exact.LiteralUtil;

  var HTMXTemplate = Exact.HTMXTemplate;

  var StyleXParser = Exact.StyleXParser;
  var ExpressionParser = Exact.ExpressionParser;
  var TextStringParser = Exact.TextStringParser;

  var ObjectUtil_defineProp = ObjectUtil.defineProp;

  var BLANK_REGEXP = /[\n\r\t]/g;

  var SPECIAL_KEYS  = { //TODO: x-as="title" => set('title', value), x-ask="insert[1]" => insert(value, 1), x:type, x:style
    'x-as': 'as',
    'x-id': 'uid',
    //'x-on': 'actions', //TODO: remove
    'x-type': 'type',
    //'x-stay': 'stay',
    'x-attrs': 'attrs',
    'x-style': 'style',
    'x-class': 'classes'
  };

  var COMMON_TYPES = { //TODO: Exact.Constants
    'number': 'number', 'boolean': 'boolean', 'string': 'string', 'json':'json', 'contents': 'contents'//, contents
  };

  function getSpecials($template) {
    var key, x_key, specials = {};

    for (x_key in SPECIAL_KEYS) {
      if (!SPECIAL_KEYS.hasOwnProperty(x_key)) { continue; }

      key = SPECIAL_KEYS[x_key];

      if (Skin.hasAttr($template, x_key)) {
        specials[key] = Skin.getAttr($template, x_key);
        //Skin.removeAttr($template, x_key);
      }
    }

    //specials.stay = 'stay' in specials;

    return specials;
  }

  function getContents($child, imports) {
    var i, n , contents = [], $contents = Skin.getChildrenCopy($child);

    for (i = 0, n = $contents.length; i < n; ++i) {
      contents.push(compile($contents[i], imports));
    }

    return contents;
  }

  function parseSpecials(node, $template, imports) {
    var specials = getSpecials($template);

    //node.stay = specials.stay;
    if (specials.as) {
      node.as = specials.as;//Skin.toCamelCase(specials.as);
    }

    if (specials.uid) {
      node.uid = specials.uid;//Skin.toCamelCase(specials.id);
    }


    if (specials.type) {
      var type = specials.type;

      if (!(type in COMMON_TYPES)) {
        type = RES.search(type, imports);

        if (!type) {
          throw new TypeError('can not find such type');
        }
      }

      ObjectUtil_defineProp(node, 'type', {value: type}); //TODO: node.type = type, freeze node at last.
    }

    if (specials.attrs) {
      ObjectUtil_defineProp(node, 'attrs', {value: StyleXParser.parse(specials.attrs, imports, '')}); //TODO: x-style="color: red; width: ${width | px}; height: ${height | %}"
    }

    if (specials.style) {
      ObjectUtil_defineProp(node, 'style', {value: StyleXParser.parse(specials.style, imports, '')}); //TODO: x-style="color: red; width: ${width | px}; height: ${height | %}"
    }

    if (specials.classes) {
      //TODO: Skin.getProp('className') ...
      ObjectUtil_defineProp(node, 'classes', {value: StyleXParser.parse(specials.classes, imports, 'boolean')}); //TODO: x-class="ok: true; active: ${active}"
    }

    //if (specials.actions) { //TODO: remove
    //  var value = StyleXParser.parse(specials.actions, imports, '');
    //  //fixForActions(value.expressions);
    //  ObjectUtil_defineProp(node, 'actions', {value: value}); //TODO: x-on="click: onClick; change: onChange"
    //}
  }

  function parsePropFromAttr(node, key, expr, type, imports) {
    var props, literal, expression;

    props = node.props;
    if (!props) {
      ObjectUtil_defineProp(node, 'props', {value: {}});
      props = node.props;
    }
    
    if (!expr) {
      literal = true;
    } else if (ExpressionParser.isExpression(expr)) { 
      expression = ExpressionParser.parse(expr, imports);
    } else if (TextStringParser.isStringTemplate(expr)) {
      expression = TextStringParser.parse(expr, imports);
    } else {
      literal = LiteralUtil.parse(expr, type);
    }

    if (expression) {
      if (!props.expressions) {
        ObjectUtil_defineProp(props, 'expressions', {value: {}});
      }

      var expressions = props.expressions;

      expressions[key] = expression;
    } else {
      props[key] = (literal !== undefined) ? literal : expr;
    }

  }

  function parseSelf(node, $template, imports) {
    node.ns = Skin.getNameSpace($template);
    node.tag = Skin.getProp($template, 'tagName').toLowerCase(); //TODO: toLowerCase

    parseSpecials(node, $template, imports);

    if (!Skin.hasAttrs($template)) { return; }

    var attrs = Skin.getAttrs($template);

    for (var key in attrs) {
      if (attrs.hasOwnProperty(key) && !SPECIAL_KEYS.hasOwnProperty(key)) {
        parsePropFromAttr(node, Skin.toCamelCase(key), attrs[key], '', imports);
      }
    }
  }

  function parseChildren(node, $template, imports) {
    //Skin.normalize($template);
    var i, n, key, tag, type, text = '', stay, expression, props = node.props,
      $child, $children = Skin.getChildrenCopy($template), child, children = [];

    for (i = 0, n = $children.length; i < n; ++i) {
      $child = $children[i];

      if (Skin.isComment($child)) { continue; }

      if (Skin.isText($child)) { // TODO: normalize text nodes
        //var data = Skin.getProp($child, 'data');
        //if (!/^\s+$/.test(data)) {
          text += Skin.getProp($child, 'data');
        //}
        continue;
      } else if (text) {
        //text = text.replace(/[\n\r\t]/g, '').replace(/[ ]{2,}/g, ' ');//TODO://
        text = text.replace(BLANK_REGEXP, '').trim();

        if (TextStringParser.isStringTemplate(text)) {
          expression = TextStringParser.parse(text, imports);
          children.push(expression);
        } else {
          children.push(text);
        }

        text = '';
      }

      child = new HTMXTemplate();

      parseSelf(child, $child, imports);

      key = child.as;
      tag = child.tag;
      type = child.type;
      //stay = child.stay;

      if (key) { //TODO:
        //key = Skin.toCamelCase(key);

        if (tag !== 'value' || stay) { //TODO: <value x-as="price" x-type="number">123</value>
          if (!props) {
            props = node.props = {};
          }
          props[key] = child;
        } else if (type === 'contents') { //TODO: fistChild is not text
          if (!props) {
            props = node.props = {};
          }
          props[key] = getContents($child, imports);
        } else if (!type || type in COMMON_TYPES) {
          text = Skin.getProp($child, 'textContent');
          parsePropFromAttr(node, key, text, type, imports);
        }
      }

      parseChildren(child, $child, imports);

      if (!key || stay) {
        children.push(child);
      }
    }

    if (text) { //TODO: as function
      text = text.replace(BLANK_REGEXP, '').trim();
      if (TextStringParser.isStringTemplate(text)) {
        expression = TextStringParser.parse(text, imports);
        children.push(expression);
      } else {
        children.push(text);
      }
    }

    node.children = children;
  }

  function parse($template, imports) {
    var host = new HTMXTemplate();

    imports = imports || {};

    if (typeof $template === 'string') {
      $template = Skin.parse($template.trim())[0];
    }

    if (!Skin.isElement($template)) { return; }

    parseSelf(host, $template, imports);
    parseChildren(host, $template, imports);

    return host;
  }

  HTMXTemplate.parse = parse;

  Exact.HTMXParser = {
    parse: parse
  };
  
})();
