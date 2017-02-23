//######################################################################################################################
// src/core/compilers/HTMXCompiler.js
//######################################################################################################################
(function() {
  
  var Text = Exact.Text;
  var Shadow = Exact.Shadow;
  var Element = Exact.Element;
  var Component = Exact.Component;

  var RES = Exact.RES;
  var Collection = Exact.Collection;
  var Container = Exact.Container;

  var Evaluator = Exact.Evaluator;
  var Expression = Exact.Expression;
  var DirtyMarker = Exact.DirtyMarker;

  var emptyObject = {}, emptyArray = [];

  function initProps(props, target, context, locals, todos) {
    if (!props) { return; }

    var expressions = props.expressions;

    target.save(props);

    if (expressions) {
      todos.push({target: target, locals: locals, expressions: expressions});
    }
  }

  function initContainer(props, target, context, locals, todos) {
    if (!props) { return; }

    var expressions = props.expressions;

    target.save(props);

    if (expressions) {
      todos.push({target: target, locals: locals, expressions: expressions});
    }
  }

  function initAttrs(attrs, target, context, locals, todos) {
    if (attrs) {
      initContainer(attrs, target.attrs, context, locals, todos);
    }
  }

  function initStyle(style, target, context, locals, todos) {
    if (style) {
      initContainer(style, target.style, context, locals, todos);
    }
  }

  function initClasses(classes, target, context, locals, todos) {
    if (classes) {
      initContainer(classes, target.classes, context, locals, todos);
    }
  }

  function initActions(actions, target, context, locals, todos) {
    if (actions) {
      target.on(actions);

      var expressions = actions.expressions;

      if (expressions) {
        todos.push({target: target, locals: locals, expressions: expressions});
      }
    }
  }

  function initSelf(template, target, context, locals, todos) {
    initProps(template.props, target, context, locals, todos);
    initAttrs(template.attrs, target, context, locals, todos);
    initStyle(template.style, target, context, locals, todos);
    initClasses(template.classes, target, context, locals, todos);
    initActions(template.actions, target, context, locals, todos);
  }

  function initChildrenOrContents(template, target, context, locals, todos) {
    var i, n, tag, type, child, content, dynamic, contents = [], children = template.children;

    if (!children || !children.length) { return; }

    for (i = 0, n = children.length; i < n; ++i) {
      child = children[i];

      tag = child.tag;

      if (!tag) {
        if (child instanceof Expression) { // like "hello, @{ $.name }..."
          content = Text.create('');
          todos.push({target: content, locals: locals, expressions: {data: child}}); // TODO: collectExpressions
        } else {
          content = Text.create(child);
        }
      } else if (!child.directs) {
        type = child.type;

        if (!type) {
          if (!child.ns) {
            child.ns = template.ns;
          }
          content = Element.create(tag, child.ns/* || template.ns*/);
        } else {
          content = Component.create(type);
        }

        initialize(child, content, context, locals, todos);

        if (child.ref) {
          context[child.ref] = content; //TODO: addPart
        }
      } else {
        content = processDirects(child, context, locals, todos);
        dynamic = true;
      }

      if (content) {
        contents.push(content);
        content = null;
      }
    }

    if (!dynamic) {
      if (!template.type || target === context) {
        target.children.reset(contents);
      } else {
        target.set('contents', contents);
      }
    } else {
      collectChildrenOrContents(contents, template, target, context, locals);
    }
  }

  function processDirects(template, context, locals, todos) {
    var directs = template.directs;

    var container = Container.create({
      mode: 0,
      active: true,   // x-if
      results: null,  // x-for
      keyEval: null,  // x-key
      slotName: '',   // slot
      contents: null,
      fragment: null,
      template: template
    });

    if (directs.xIf) {
      container.active = false;
      todos.push({target: container, locals: locals, expressions: {active: directs.xIf.expression}});
    }

    if (directs.xFor) { // TODO:
      var expression = directs.xFor.expression;
      var path = expression.template.evaluator.args[0]; // $.items in x-for="item of $.items | filter"

      if (Array.isArray(path)) {
        container.mode = 1;
        
        var local = locals[path.origin];
        var prop = path[path.length - 1];
        var src = path.length < 2 ? local : RES.search(path.slice(0, path.length - 1), local, true);

        if (src && src.on) {
          var handler = function() {
            src.send('changed.' + prop, src[prop], src[prop]);
          };
          
          var dst = src[prop];
          if (dst && dst instanceof Collection) {
            dst.on('changed', handler);
          }

          src.on('changed.' + prop, function(event, dst, old) {
            if (old && old instanceof Collection) {
              old.off('changed', handler);
            }
            if (dst && dst instanceof Collection) {
              dst.on('changed', handler);
            }
          });
        }
      }

      todos.push({target: container, locals: locals, expressions: {results: expression}});

      if (directs.xKey) {
        container.keyEval = directs.xKey.evaluator;
      }
    } else if (directs.xSlot) {
      container.mode = 2;
      container.slotName = directs.xSlot.name || '';

      context.on('changed.contents', function() {
        container.set('contents', context.contents);
      });
    }

    return container;
  }

  function collectChildrenOrContents(containers, template, target, context, locals) {
    for (var i = 0,  n = containers.length; i < n; ++i) {
      var container = containers[i];

      if (container instanceof Container) {
        container.onChange = context.invalidate;
      }
    }

    context.on('updated', arrange);

    arrange();

    function arrange() {
      var collection = [], fragment, container;

      for (var i = 0, n = containers.length; i < n; ++i) {
        container = containers[i];

        if (container instanceof Shadow) {
          collection.push(container);
        } else if (container.active) {
          switch (container.mode) {
            case 0:
              if (container.hasDirty('active')) {
                DirtyMarker.clean(container, 'active');
                container.fragment = getFragmentOnCondition(container.template, context, locals);
              }
              break;
            case 1:
              if (container.hasDirty('results')) {
                DirtyMarker.clean(container, 'results');
                container.fragment = getFragmentFromResults(container.template, container.results, container.keyEval, container.fragment, context, locals); // fragment the contents
              }
              break;
            case 2:
              if (container.hasDirty('contents')) {
                DirtyMarker.clean(container, 'contents');
                container.fragment = getFragmentFromSlot(container.slotName, container.contents);
              }
              break;
          }

          fragment = container.fragment;

          if (fragment && fragment.length) {
            collection.push.apply(collection, fragment);
          }

          DirtyMarker.clean(container);
        }
      }

      if (!template.type || target === context) {
        target.children.reset(collection);
      } else {

        target.set('contents', collection);
      }
    }
  }

  function getFragmentOnCondition(template, context, locals) {
    var content = template.type ? Component.create(template.type) : Element.create(template.tag, template.ns);
    compile(template, content, context, locals);
    return  [content];
  }

  function getFragmentFromResults(template, results, keyEval, oldFrag, context, locals) {
    var fragment = [], indices = {}, index, content, temp, item, key, n, i;

    oldFrag = oldFrag || emptyArray;
    results = results || emptyArray;

    for (i = 0, n = oldFrag.length; i < n; ++i) {
      key = oldFrag[i].key;
      if (key) {
        indices[key] = i;
      }
    }

    if ('__DEV__' === 'development') {
      if (Object.keys(indices).length < oldFrag.length) {
        //console.warn('');
      }
    }

    for (i = 0, n = results.length; i < n; ++i) {
      content = null;
      item = results[i];
      temp = locals.concat([item]);

      if (keyEval) {
        key = Evaluator.activate(keyEval, 'exec', temp);
        index = indices[key];

        if (index != null) {
          content = oldFrag[index];
          oldFrag[index] = null;
        }
      }

      if (!content) {
        content = template.type ? Component.create(template.type) : Element.create(template.tag, template.ns);
        compile(template, content, context, temp);
      }

      content.key = key;
      fragment.push(content);
    }

    return fragment;
  }

  function getFragmentFromSlot(name, contents) {
    var fragment = [];

    if (contents) {
      for (var i = 0, n = contents.length; i < n; ++i) {
        var content = contents[i];
        if (name === (content.props.slot || '')) {
          fragment.push(content);
        }
      }
    }

    return fragment;
  }

  function complete(context, todos) {
    var i, n, todo, key, target, locals, expression, expressions;

    for (i = 0, n = todos.length; i < n; ++i) {
      todo = todos[i];
      target = todo.target;
      locals = todo.locals;
      expressions = todo.expressions;

      for (key in expressions) {
        if (!expressions.hasOwnProperty(key)) {
          continue;
        }

        expression = expressions[key];

        if (expression) {
          Expression.activate(expression, key, target, context, locals); // TODO: locals = [component, null, ]
        }
      }
    }
  }
  // TODO: initialize, update, build, write, patch
  function initialize(template, target, context, locals, todos) {
    initSelf(template, target, context, locals, todos);
    initChildrenOrContents(template, target, context, locals, todos);
  }

  function compile(template, target, context, locals) { // TODO: host, data, event
    context = context || target;

    if (context === target) {
      locals = [context];
    }

    var todos = [];

    initialize(template, target, context, locals, todos);

    complete(context, todos); // TODO: later

    context._template = template;
  }

  Exact.HTMXCompiler = {
    initialize: initialize,
    compile: compile
  };

})();
