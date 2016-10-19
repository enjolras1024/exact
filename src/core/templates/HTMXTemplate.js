
(function() {
  'use strict';

  var Text = Exact.Text;
  var Shadow = Exact.Shadow;
  var Element = Exact.Element;
  var Component = Exact.Component;

  var ObjectUtil = Exact.ObjectUtil
  var ExpressionUtil = Exact.ExpressionUtil;

  function HTMXTemplate() {
    this.id = '';         //string, local id
    this.as = '';         //string, key in target
    this.tag = '';        //string, tag name
    this.type = null;     //Function, constructor
    this.stay = false;    //boolean
    this.attrs = null;    //Object like {literals: {title: 'Hi'}, expressions: {'data-msg': {...}}}
    this.style = null;    //Object like {literals: {color: 'red'}, expressions: {fontSize: {...}}}
    //this.actions = null;  //Object like {literals: {click: 'onClick'}, expressions: {change: {...}}}
    this.classes = null;  //Object like {literals: {highlight: true}, expressions: {active: {...}}}
    this.children = null; //Array like []
    this.literals = null; //Object like {title: 'Hi'}
    this.expressions = null; //Object like {title: {type: null, template: null}}
  }

  HTMXTemplate.parse = null; // Interface,

  function initStyle(target, scope, template) {
    //var styleString = template.literals.style;//TODO: warn in HTMLTemplate
    if (template.style) {
      initProps(target.style, scope, template.style);
    }
  }
  
  function initAttrs(target, scope, template) {
    if (template.attrs) {
      initProps(target.attrs, scope, template.attrs);
    }
  }

  function initProps(target, scope, template) {
    if (!template) { return; }

    var literals = template.literals;
    var expressions = template.expressions;

    if (literals) {
      target.set(literals);
      //target.reset(literals);
    }

    if (expressions) {
      scope._expressionsQueue.push({target: target, expressions: expressions});
    }
  }

  function initClasses(target, scope, template) {
    if ((template.expressions && template.expressions.className) && template.classes) {
      console.warn('ignore'); //TODO: warn in HTMXTemplate, class="`btn &{$.active? 'active':''}`"
    }

    var i, names, classes, literals = template.literals, className = literals ? literals.className : '';

    if (className) {
      if (!template.classes) {
        template.classes = new Exact.StyleXTemplate();
      }

      classes = template.classes;

      if (!classes.literals) {
        classes.literals = {};
      }

      literals = classes.literals;

      names = className.split(/\s/);
      for (i = 0; i < names.length; ++i) {
        literals[names[i]] = true;
      }
    }

    if (template.classes) {
      initProps(target.classes, scope, template.classes);
    }
  }

  function initSelf(target, scope, template) {
    //TODO:

    initProps(target, scope, template);
    initAttrs(target, scope, template);
    initStyle(target, scope, template);
    initClasses(target, scope, template);
    //initActions(target, scope, template);
  }


  function initChildren(target, scope, template) {
    var i, n, id, tag, type, child, content, contents = [], children = template.children;

    if (!children) { return; }

    for (i = 0, n = children.length; i < n; ++i) {
      child = children[i];

      if (typeof child === 'string') {
        content = Text.create(child);
      } else if (ExpressionUtil.isExpression(child)) {
        content = Text.create('');
        scope._expressionsQueue.push({target: content, expressions: {data: child}});
      } else if (child instanceof Object) {
        id = child.id;
        tag = child.tag;
        type = child.type;
        //literals = child.literals; //TODO:

        if (!type) {
          content = Element.create(tag);
        } else {
          content = Component.create(type);
        }
        //TODO: collect contents/slots, scope._expressionsQueue.push({target: content, expressions: {placeholder: {}}});
        initSelf(content, scope, child);
        initChildren(content, scope, child);

        if (id) {
          scope[id] = content; //TODO: addPart
        }
      }

      contents.push(content);
    }

    if (!template.type || target === scope) {
      target.children.reset(contents); //TODO: replace, reset
    } else {
      target.set('contents', contents);
      //target.contents.reset(contents); //TODO: replace, reset
    }
  }

  function initExpressions(component) {
    var i, n, queue = component._expressionsQueue, item, key, target, expression, expressions;

    for (i = 0, n = queue.length; i < n; ++i) {
      item = queue[i];
      target = item.target;
      expressions = item.expressions;

      for (key in expressions) {
        if (expressions.hasOwnProperty(key)) {
          expression = expressions[key];
          ExpressionUtil.applyExpression(expression, component, target, key);
        }
      }
    }
  }

  HTMXTemplate.compile = function compile(template, component) {
    component._expressionsQueue = []; //TODO: _todos

    initSelf(component, component, template);
    initChildren(component, component, template);

    initExpressions(component);

    delete component._expressionsQueue;
  };

  Exact.HTMXTemplate = HTMXTemplate; //HTMXTemplate

})();
