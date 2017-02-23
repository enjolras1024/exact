//######################################################################################################################
// src/core/compilers/HTMXCompiler.js
//######################################################################################################################
(function() {

  var Text = Exact.Text;
  var Element = Exact.Element;
  var Component = Exact.Component;

  var HTMXTemplate = Exact.HTMXTemplate;
  var HTMXCompiler = Exact.HTMXCompiler;

  var emptyObject = {}, emptyArray = [];

  function resetProps(target, props, _props) {
    var defaults = target.constructor.defaults;

    props = Exact.assign({}, typeof defaults === 'function' ? defaults() : null, props);

    for (var key in _props) {
      if (_props.hasOwnProperty(key) && !props.hasOwnProperty(key)) {
        target.unset(key);
        //target.set(key, undefined);
        //delete _props[key];
      }
    }

    target.save(props);
  }

  function resetContainer(container, _container) {
    container = container || {};

    for (var key in _container) {
      if (_container.hasOwnProperty(key) && !container.hasOwnProperty(key)) {
        _container.set(key, undefined);
        delete _container[key];
      }
    }

    _container.save(container);
  }

  function resetActions(target, actions) {
    //if (actions.off) {
    //  target.off();
    //  delete actions.off;
    //}
    //target.off();
    target.on(actions);
  }

  function updateSelf(template, target) {
    resetProps(target, template.props, target._props);

    resetContainer(template.attrs, target.attrs);
    resetContainer(template.style, target.style);
    resetContainer(template.classes, target.classes);

    resetActions(target, template.actions);
  }

  function isMatched(shadow, template) {
    var type = template.type, tag = template.tag || '';
    return shadow.key === template.key && (type ? type === shadow.constructor : tag === shadow.tag);
  }

  function createChild(template, context) {
    var child;

    if (template.type) {
      child = Component.create(template.type);
      HTMXCompiler.initialize(template, child, context);
    } else if (template.tag) {
      child = Element.create(template.tag, template.ns);
      HTMXCompiler.initialize(template, child, context);
    } else {
      child = Text.create(template);
    }

    if (template.ref) {
      context[template.ref] = child;
    }

    return child;
  }

  function updateChildrenOrContents(template, target, context) {
    var _children = (target instanceof Component && target !== context) ? (target.contents || []) : target.children;

    if (_children === template.children) { return; }

    var children  = template.children || [],  contents = new Array(children.length), indices, key;

    var oldBeginIndex = 0, oldEndIndex = _children.length - 1, newBeginIndex = 0, newEndIndex = children.length - 1;
    var oldBeginChild = _children[oldBeginIndex];
    var oldEndChild = _children[oldEndIndex];
    var newBeginChild = children[newBeginIndex];
    var newEndChild = children[newEndIndex];

    while (oldBeginIndex <= oldEndIndex && newBeginIndex <= newEndIndex) {

      if (oldBeginChild == null) {
        oldBeginChild = _children[++oldBeginIndex]; // Vnode has been moved left
      } else if (oldEndChild == null) {
        oldEndChild = _children[--oldEndIndex];
      } else if (isMatched(oldBeginChild, newBeginChild)) {
        updateSelfAndChildrenOrContents(newBeginChild, oldBeginChild, context);
        contents[newBeginIndex] = oldBeginChild;
        oldBeginChild = _children[++oldBeginIndex];
        newBeginChild = children[++newBeginIndex];
      } else if (isMatched(oldEndChild, newBeginChild)) {
        updateSelfAndChildrenOrContents(newBeginChild, oldEndChild, context);
        contents[newEndIndex] = oldEndChild;
        oldEndChild = _children[--oldEndIndex];
        newEndChild = children[--newEndIndex];
      } else if (isMatched(oldBeginChild, newEndChild)) {
        updateSelfAndChildrenOrContents(newBeginChild, oldBeginChild, context);
        contents[newEndIndex] = oldBeginChild;
        oldBeginChild = _children[++oldBeginIndex];
        newEndChild = children[--newEndIndex];
      } else if (isMatched(oldEndChild, newBeginChild)) {
        updateSelfAndChildrenOrContents(newBeginChild, oldEndChild, context);
        contents[newBeginIndex] = oldEndChild;
        oldEndChild = _children[--oldEndIndex];
        newBeginChild = children[++newBeginIndex];
      } else  {
        if (!indices) {
          indices = {};
          for (var i = oldBeginIndex; i <= oldEndIndex; ++i) {
            key = _children[oldBeginIndex].key;
            if (key) {
              indices[key] = i;
            }
          }
        }

        key = newBeginChild.key;
        i = key && indices[key];

        if (i != null && isMatched(_children[i] || emptyObject, newBeginChild)) {
          contents[newBeginIndex] = _children[i];
        } else {
          contents[newBeginIndex] = createChild(newBeginChild, context);
        }

        updateSelfAndChildrenOrContents(newBeginChild, contents[newBeginIndex], context);

        newBeginChild = children[++newBeginIndex];
      }
    }

    if (oldBeginIndex > oldEndIndex) {
      while (newBeginIndex <= newEndIndex) {
        contents[newBeginIndex] = createChild(newBeginChild, context);
        newBeginChild = children[++newBeginIndex];
      }
    }

    if (!(target instanceof Component) /*|| !template.type*/ || target === context) {
      target.children.reset(contents);
    } else {
      target.set('contents', contents);
    }

  }

  function updateSelfAndChildrenOrContents(template, target, context) {
    if (template instanceof HTMXTemplate) {
      updateSelf(template, target);
      updateChildrenOrContents(template, target, context);
    } else {
      target.set('data', template);
    }
  }


  function update(target, data, children) {
    var template = HTMXTemplate.create(target instanceof Component ? target.constructor : target.tag, data, children);
    updateSelfAndChildrenOrContents(template, target, target);
    return target;
  }

  Exact.HTMXUpdater = {
    update: update
  }

})();
