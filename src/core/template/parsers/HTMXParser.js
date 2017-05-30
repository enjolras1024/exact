//######################################################################################################################
// src/core/template/parsers/HTMXParser.js
//######################################################################################################################
(function() {
  var LiteralUtil = Exact.LiteralUtil;

  var HTMXTemplate = Exact.HTMXTemplate;

  var HTMLParser = Exact.HTMLParser;
  var EvaluatorParser = Exact.EvaluatorParser;
  var DataBindingParser = Exact.DataBindingParser;
  var TextBindingParser = Exact.TextBindingParser;
  var EventBindingParser = Exact.EventBindingParser;

  var CONTEXT_SYMBOL = Exact.CONTEXT_SYMBOL;
  var BINDING_OPERATORS = Exact.BINDING_OPERATORS;

  /* /[\&\@\#\+\?]/ */
  var BINDING_OPERATORS_REGEXP = new RegExp(
    '[\\' + BINDING_OPERATORS.ONE_TIME +
    '\\' + BINDING_OPERATORS.ONE_WAY +
    '\\' + BINDING_OPERATORS.TWO_WAY +
    '\\' + BINDING_OPERATORS.EVENT +
    '\\' + BINDING_OPERATORS.TEXT + ']'
  );

  var BLANK_REGEXP = /^ *\r?\n *$/;///[\f\n\r\t\v]/g; // TODO: how about <pre>

  var ARRAY_COPY_EVAL = Exact.Evaluator.create(function(items) {
    return items ? items.slice(0) : [];
  });

  function getData(template, key) {
    var data = template[key];

    if (!data) {
      data = template[key] = {};
    }

    return data;
  }

  function getExpressions(data) {
    if (!data.expressions) {
      Exact.defineProp(data, 'expressions', {
        value: {}
      });
    }

    return data.expressions;
  }

  function toClasses(className) {
    var i, names, classes = {};

    names = className.split(/\s+/);

    for (i = 0; i < names.length; ++i) {
      classes[names[i]] = true;
    }

    return classes;
  }

  function parseText(text, resources, identifiers) {
    if (!text || BLANK_REGEXP.test(text)) { return; }

    if (TextBindingParser.like(text)) {
      var expression = TextBindingParser.parse(text, resources, identifiers);
    }

    return expression || text;
  }

  function parseHandlerFromExpr(actions, key, expr, resources, identifiers) {
    var expressions = getExpressions(actions);
    expressions[key] = EventBindingParser.parse(expr, resources, identifiers);
  }

  function parseBindingFromExpr(props, key, operator, expr, resources, identifiers) {
    var expression, expressions = getExpressions(props);

    if (operator !== BINDING_OPERATORS.TEXT) { // TODO:
      expression = DataBindingParser.parse(operator, expr, resources, identifiers);
    } else {
      expression = TextBindingParser.parse(expr, resources, identifiers);
    }

    expressions[key] = expression;//DataBindingParser.parse(expr, operator, resources);
  }

  /**
   *
   * @param {Object} props
   * @param {string} key
   * @param {string} expr
   * @param {string} type '' - no parsing, '*' - any type, else given type
   */
  function parsePropFromExpr(props, key, expr, type) {
    if (type && expr) {
      type = type !== '*' ? type : '';
      var prop = LiteralUtil.parse(expr, type);
      props[key] = prop != null ? prop : (type ? prop : expr);
    } else {
      props[key] = expr; // TODO: boolean, like `checked` ...
    }
  }

  function parseDirects(_template, directs, resources) {
    if (!directs) { return; }

    var _directs = getData(_template, 'directs'), identifiers = _template.identifiers;

    if (directs.xIf) {
      _directs.xIf = {
        expression: DataBindingParser.parse(BINDING_OPERATORS.ONE_WAY, directs.xIf, resources, identifiers)
      };
    }

    if (directs.xFor) {
      if (directs.xSlot) {
        throw new Error('You should not use x-for on <slot>');
      }

      var expr = directs.xFor;

      var matches = expr.match(/[ ]*([\w\_]+)[ ]+of[ ]+(.+)/); //TODO:

      if (!matches) {
        throw new Error('x-for="' + expr + '" is illegal');
      }

      var expression = DataBindingParser.parse(BINDING_OPERATORS.ONE_WAY, matches[2] /*+ ' *'*/, resources, identifiers);

      if (expression) {
        var converters = expression.template.converters;
        if (!converters) {
          expression.template.converters = converters = []
        }
        converters.push(ARRAY_COPY_EVAL);
        _directs.xFor = {
          //itemsPath: expression.template.evaluator.args[0],
          expression: expression
        };
      }

      identifiers = identifiers.concat([matches[1]]);
      _template.identifiers = identifiers;

      if (directs.xKey) {
        _directs.xKey = {
          evaluator: EvaluatorParser.parse(directs.xKey, resources, identifiers)
        };
      }
    }

    if (directs.xSlot != null) {
      _directs.xSlot = {
        name: directs.xSlot
      };
    }
  }

  function parseParams(_template, parameters, resources, name, virtual) {
    if (!parameters) { return; }
    
    var identifiers = _template.identifiers, operator, expr, key, n_1;
    
    for (key in parameters) {
      if (!parameters.hasOwnProperty(key)) { continue; }

      n_1 = key.length - 1;
      operator = key[n_1];
      expr = parameters[key];

      if (BINDING_OPERATORS_REGEXP.test(operator)) {
        key = key.slice(0, n_1);

        if (operator === BINDING_OPERATORS.EVENT) {
          parseHandlerFromExpr(
            getData(_template, 'actions'), key, expr, resources, identifiers
          );
        } else {
          parseBindingFromExpr(
            getData(_template, name), key, operator, expr, resources, identifiers
          );
        }
      } else if (virtual) {
        parsePropFromExpr(
          getData(_template, name), key, expr, '*'
        );
      } else {
        getData(_template, name)[key] = expr;
      }
    }
  }

  function optimize(_template, template) {
    var _attrs, _props = _template.props;

    if (template.ref) { // x-ref
      _attrs = getData(_template, 'attrs');
      _attrs['x-ref'] = template.ref;
      _template.ref = template.ref;
    }

    if (!_props) { return; }

    if (_props.className) { // merge into classes
      var className = _props.className;
      var names = toClasses(className);

      var classes = _template.classes || {};

      for (var name in names) {
        if (names.hasOwnProperty(name) && !(classes.hasOwnProperty(name))) {
          classes[name] = true;
        }
      }

      _template.classes = classes;

      delete _props.className;
    }

    if (_props.style) {
      _attrs = getData(_template, 'attrs');

      _attrs.style = _props.style;

      delete _props.style;
    }

    var expressions = _props.expressions;

    if (!expressions) { return; }

    if (expressions.className) {
      _attrs = getData(_template, 'attrs');

      getExpressions(_attrs)['class'] = expressions.className;

      delete expressions.className;
    }

    if (expressions.style) {
      _attrs = getData(_template, 'attrs');

      getExpressions(_attrs)['style'] = expressions.style;

      delete expressions.style;
    }
  }

  function parseSelf(_template, template, resources) {
    _template.ns = template.ns;
    _template.tag = template.tag;
    _template.type = template.type;

    if (template.tag === 'slot') {
      getData(template, 'directs').xSlot = (template.props && template.props.name) || '';
    }

    parseDirects(_template, template.directs, resources);

    parseParams(_template, template.props, resources, 'props', template.virtual);
    parseParams(_template, template.style, resources, 'style', false);
    parseParams(_template, template.attrs, resources, 'attrs', false);
    parseParams(_template, template.classes, resources, 'classes', true);

    optimize(_template, template);
  }

  function parseChildren(_template, template, resources) {
    var i, n, text = '', _child, _children = [], child, children = template.children, identifiers = _template.identifiers;

    if (!children || !children.length) { return; }

    for (i = 0, n = children.length; i < n; ++i) {
      child = children[i];

      if (typeof child === 'string') { // TODO: normalize text nodes
        text += child;
        continue;
      } else if (text) {
        _child = parseText(text, resources, identifiers);
        if (_child) {
          _children.push(_child);
        }
        text = '';
      }

      _child = new HTMXTemplate();

      _child.identifiers = identifiers;

      parseSelf(_child, child, resources);

      parseChildren(_child, child, resources);

      _children.push(_child);
    }

    if (text) {
      _child = parseText(text, resources, identifiers);
      if (_child) {
        _children.push(_child);
      }
    }

    _template.children = _children;
  }

  function parse(template, resources) {
    resources = resources || {};

    if (!(template instanceof HTMXTemplate)) {
      template = HTMLParser.parse(template, resources);
    }

    var _template = new HTMXTemplate();

    _template.identifiers = [CONTEXT_SYMBOL];

    parseSelf(_template, template, resources); // TODO: identifiers

    parseChildren(_template, template, resources);

    return _template;
  }

  Exact.HTMXParser = {
    parse: parse
  };

  Exact.HTMXEngine.parse = parse;

})();
