//######################################################################################################################
// src/core/templates/HTMXTemplate.js
//######################################################################################################################
(function() {
  'use strict';

  var Text = Exact.Text;
  var Shadow = Exact.Shadow;
  var Element = Exact.Element;
  var Component = Exact.Component;

  var ObjectUtil = Exact.ObjectUtil;
  var ExpressionUtil = Exact.ExpressionUtil;

  var PropsTemplate = Exact.PropsTemplate;

  function HTMXTemplate() {
    this.ns = '';         // namespace
    //this.as = '';         //string, key of target
    this.uid = '';         //string, local id
    //this.key = '';         //string, key in list
    this.tag = '';        //string, tag name
    this.type = null;     //Function, constructor
    //this.stay = false;    //boolean
    this.props = null;
    this.attrs = null;    //Object like {literals: {title: 'Hi'}, expressions: {'data-msg': {...}}}
    this.style = null;    //Object like {literals: {color: 'red'}, expressions: {fontSize: {...}}}
    this.classes = null;  //Object like {literals: {highlight: true}, expressions: {active: {...}}}
    this.children = null; //Array like []
    //this.literals = null; //Object like {title: 'Hi'}
    //this.expressions = null; //Object like {title: {type: null, template: null}}
//TODO: this.props = {expressions: null}
    //this.actions = null;  // for refactor
    //this.indices = null;  // for refactor
  }

  var emptyObject = {}, emptyArray = [];

  var specials = {
    uid: true, attrs: true, style: true, classes: true, actions: true
  };

  function create(type, params, children) {
    var template = new HTMXTemplate();
    
    if (typeof type === 'string') {
      template.tag = type;
    } else {
      template.type = type;
    }

    if (params) {
      template.uid = params.uid;
      template.attrs = params.attrs;
      template.style = params.style;
      template.classes = params.classes;
      template.actions = params.actions;

      var flag, props = {};

      for (var key in params) {
        if (params.hasOwnProperty(key) && !specials[key]) {
          props[key] = params[key];
          flag = true;
        }
      }

      if (flag) {
        template.props = props;
      }
    }

    template.children = children;
    
    return template;
  }

  //HTMXTemplate.parse = null; // Interface,

  function initStyle(target, scope, style) {
    //var styleString = template.literals.style;//TODO: warn in HTMLTemplate
    if (style) {
      initProps(target.style, scope, style);
    }
  }

  function initAttrs(target, scope, attrs) {
    if (attrs) {
      initProps(target.attrs, scope, attrs);
    }
  }

  function initProps(target, scope, props) {
    if (!props) { return; }

    var expressions = props.expressions;

    if (props) {
      target.set(props);
    }

    if (expressions) {
      scope._todos.push({target: target, expressions: expressions});
    }
  }

  function initClasses(target, scope, classes, template) {
    //if ((template.expressions && template.expressions.className) && template.classes) {
    //  console.warn('ignore'); //TODO: warn in HTMXParser, class="`btn &{$.active? 'active':''}`"
    //}
//TODO: do this in HTMXParser
    var i, names, props = template.props, className = props ? props.className : '';

    if (className) {
      //classes = template.classes;

      if (!classes) {
        classes = template.classes = new PropsTemplate(); //TODO: defineProp
        // new Exact.StyleXTemplate();
      }

      names = className.split(/\s/);
      for (i = 0; i < names.length; ++i) {
        classes[names[i]] = true;
      }
    }

    if (classes) {
      initProps(target.classes, scope, classes);
    }
  }

  function initActions(target, actions) {
    if (actions) {
      target.on(actions);
    }
  }

  function initSelf(scope, target, template) {
    initProps(target, scope, template.props);
    initAttrs(target, scope, template.attrs);
    initStyle(target, scope, template.style);
    initClasses(target, scope, template.classes, template);
    initActions(target, template.actions);
  }


  function initChildrenOrContents(scope, target, template) {
    var i, n, uid, tag, type, child, content, contents = [], children = template.children;

    if (!children) { return; }

    for (i = 0, n = children.length; i < n; ++i) {
      child = children[i];

      if (typeof child === 'string') {
        content = Text.create(child);
      } else if (ExpressionUtil.isExpression(child)) {
        content = Text.create('');
        scope._todos.push({target: content, expressions: {data: child}});
      } else if (child instanceof Object) {
        uid = child.uid;
        tag = child.tag;
        type = child.type;
        //literals = child.literals; //TODO:

        if (!type) {
          content = Element.create(tag, child.ns);
        } else {
          content = Component.create(type);
        }
        //TODO: collect contents/slots, scope._todos.push({target: content, expressions: {placeholder: {}}});
        initSelfAndChildrenOrContents(scope, content, child);

        if (uid) {
          scope[uid] = content; //TODO: addPart
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
    var i, n, queue = component._todos, item, key, target, expression, expressions;

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
  
  function initSelfAndChildrenOrContents(scope, target, template) {
    initSelf(scope, target, template);
    initChildrenOrContents(scope, target, template);
  }

  function compile(template, component) {
    component._todos = []; //TODO: _todos

    initSelfAndChildrenOrContents(component, component, template);

    initExpressions(component);

    delete component._todos;

    component._template = template;
  }

  function resetProps(target, props, prev) {
    if (target.defaults) {
      var defaults = target.defaults();
    }

    var all = ObjectUtil.assign({}, defaults, props);

    if (prev) {
      for (var key in prev) {
        if (prev.hasOwnProperty(key) && !all.hasOwnProperty(key)) {
          all[key] = undefined;
        }
      }
    }

    target.set(all);
  }

  function resetAttrs(target, props, prev) {
    if (!props && !prev) { return; }

    resetProps(target.attrs, props, prev);
  }

  function resetStyle(target, props, prev) {
    if (!props && !prev) { return; }

    resetProps(target.style, props, prev);
  }

  function resetClasses(target, props, prev) {
    if (!props && !prev) { return; }

    resetProps(target.classes, props, prev);
  }

  function resetActions(target, actions) {
    if (!actions) { return; }

    if (actions.off) {
      target.off();
    }

    delete actions.off;

    target.on(actions);
  }

  function resetSelf(target, template) {
    var _template = target._template || emptyObject;

    resetProps(target, template.props, _template.props);
    resetAttrs(target, template.attrs, _template.attrs);
    resetStyle(target, template.style, _template.style);
    resetClasses(target, template.classes, _template.classes);

    resetActions(target, template.actions);
  }

  function resetChildrenOrContents(scope, target, template) {
    var i, m, n, key, child, 
      existed, content, olIndices, newIndices,
      _template = target._template || emptyObject, 
      existeds = _template.children || emptyArray, 
      contents = template.children;

    var oldContents, newContents = [];
    if (!(target instanceof Component) || scope === target) {
      oldContents = target.children || emptyArray;
    } else {
      oldContents = target.contents || emptyArray;
    }

    olIndices = _template.indices || emptyObject;

    //m = existeds.length;
    n = contents.length;

    for (i = 0; i < n; ++i) {
      existed = existeds[i];
      content = contents[i];

      if (content instanceof Shadow) {
        newContents.push(content);
        continue;
      }

      key = content.key;

      if (key) {
        newIndices = newIndices || {};
        newIndices[key] = i;

        if (__DEV__ === 'development' && key in newIndices) {
          console.warn('key should not be duplicate, but "' + key +'" is duplicate');
        }

        if (/*olIndices && */key in olIndices) {
          child = oldContents[olIndices[content.key]];

          resetSelfAndChildrenOrContents(scope, child, content);

          newContents.push(child);
          continue;
        }
      }

      if (content.type) {
        if (existed && content.type === existed.type) {
          child = oldContents[i];
          resetSelfAndChildrenOrContents(scope, child, content);
        } else {
          child = Component.create(content.type);
          initSelfAndChildrenOrContents(scope, child, content);
        }
      } else if (content.tag) {
        if (existed && !existed.type && existed.tag === content.tag) {
          child = oldContents[i];
          resetSelfAndChildrenOrContents(scope, child, content);
        } else {
          child = Element.create(content.tag, content.ns);
          initSelfAndChildrenOrContents(scope, child, content);
        }
      } else {
        if (existed && !existed.tag && !existed.type) {//TODO: maybe expression
          child = oldContents[i]; // text
          child.set('data', content);
        } else {
          child = Text.create(content);
        }
      }

      if (content.uid) {
        scope[uid] = child;
      }

      newContents.push(child);
    }

    if (!(target instanceof Component) || scope === target) {
      target.children.reset(newContents);
    } else {
      target.set('contents', newContents);
    }
    
    template.indices = newIndices;
  }
  
  function resetSelfAndChildrenOrContents(scope, target, template) {
    resetSelf(target, template);
    resetChildrenOrContents(scope, target, template);
  }

  function refactor(target, template) {
    //var _template = target._template; //TODO: _secrets
    resetSelfAndChildrenOrContents(target, target, template);

    target._template = template;

    return target;
  }

  HTMXTemplate.create = create;
  HTMXTemplate.compile = compile;
  HTMXTemplate.refactor = refactor;

  Exact.HTMXTemplate = HTMXTemplate; //HTMXTemplate

})();
