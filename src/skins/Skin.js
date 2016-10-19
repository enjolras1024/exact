//######################################################################################################################
// src/skins/Skin.js
//######################################################################################################################
(function() {

  'use strict';

  var FIX_KEYS = {'for': 'htmlFor', 'class': 'className', 'float': 'cssFloat'};

  var doc = window.document,
    table = doc.createElement('table'),
    tableRow = doc.createElement('tr');

  var containers = {
    '*': doc.createElement('div'),
    'option': doc.createElement('select'),
    'tr': doc.createElement('tbody'),
    'td': tableRow, 'th': tableRow,
    'tbody': table, 'thead': table, 'tfoot': table
  };

  // In IE 8, text node is not extensible
  var textIsExtensible = true, text = doc.createTextNode(' ');
  try {
    text.hasOwnProperty('nodeValue');
    text._toIndex = -1;
  } catch (error) {
    textIsExtensible = false;
  }
  
  var delegatedEvents = {},
    preventDefault, _preventDefault,
    stopPropagation, _stopPropagation,
    stopImmediatePropagation, _stopImmediatePropagation;

  function decideEventMethods(event) {
    if (event.preventDefault) {
      _preventDefault = event.preventDefault;
      preventDefault = function() {
        this.isDefaultPrevented = true;//TODO: writable = false
        _preventDefault.call(this);
      };
    } else {
      preventDefault = function() {
        this.isDefaultPrevented = true;//TODO: writable = false
        this.returnValue = true;
      };
    }

    if (event.stopPropagation) {
      _stopPropagation = event.stopPropagation;
      stopPropagation = function() {
        this.isPropagationStopped = true;//TODO: writable = false
        _stopPropagation.call(this);
      }
    } else {
      stopPropagation = function() {
        this.isPropagationStopped = true;//TODO: writable = false
        this.cancelBubble = true;
      }
    }

    if (event.stopImmediatePropagation) {
      _stopImmediatePropagation = event.stopImmediatePropagation;
      stopImmediatePropagation = function() {
        this.isPropagationImmediateStopped = true;//TODO: writable = false
        _stopImmediatePropagation.call(this);
      }
    } else {
      stopImmediatePropagation = function() {
        this.isPropagationImmediateStopped = true;//TODO: writable = false
        this.cancelBubble = true;
      }
    }
  }

  //TODO: 删除不必要的方法

  function Skin() {
    throw new Error('');
  }

  //TODO: 把方法拿出来， 免得Skin.xxx()

  Exact.defineClass({
    constructor: Skin,

    statics: {
      /**
       * @required
       */
      toCamelCase: function(key) {
        if (FIX_KEYS.hasOwnProperty(key)) {
          return  FIX_KEYS[key];
        }

        //return key.replace(/-(.)?/g, function(match, char) {
        return key.replace(/-([a-z])?/g, function(match, char) {
          return char ? char.toUpperCase() : '';
        });
      },
      //
      //textIsExtensible: function() {
      //  return textIsExtensible;
      //},

      /**
       * @required
       */
      canExtend: function($skin) {
        if (textIsExtensible) {
          return true;
        } else {
          var ok = true;
          try {
            $skin._toIndex = -1;
          } catch (error) {
            ok = false;
          }
          return ok;
        }
      },

      /**
       * @required
       */
      isText: function($skin) {
        return $skin && $skin.nodeType === 3;
      },

      /**
       * @required
       */
      isComment: function($skin) {
        return $skin && $skin.nodeType === 8;
      },

      /**
       * @required
       */
      isElement: function($skin) {
        return $skin && $skin.nodeType === 1;
      },

      isFragment: function($skin) {
        return $skin && $skin.nodeType === 11;
      },

      /**
       * @required
       */
      createText: function(data) {
        return doc.createTextNode(data);
      },

      /**
       * @required
       */
      createElement: function(tag) {//TODO: cache, clone
        return doc.createElement(tag);
      },

      createFragment: function() {
        return doc.createDocumentFragment();
      },

      /**
       * @required
       */
      parse: function(html) {
        var idx = html.search(/ |>/), tag = html.slice(1, idx);

        if (!(tag in containers)) { tag = '*'; }
        var container = containers[tag];
        container.innerHTML = html;

        return Skin.getChildrenCopy(container);
      },

      clone: function($skin) {
        return $skin.cloneNode(true);
      },

      /**
       * @required
       */
      focus: function($skin) {
        return $skin.focus();
      },

      /**
       * @required
       */
      blur: function($skin) {
        return $skin.blur();
      },

      /**
       * @required
       */
      hasAttrs: function($skin) {
        return $skin.hasAttributes ? $skin.hasAttributes() : ($skin.attributes && $skin.attributes.length > 0);
      },

      /**
       * @required
       */
      getAttrs: function($skin) {
        return $skin.attributes;
      },

      /**
       * @required
       */
      hasAttr: function($skin, name) {
        return $skin.hasAttribute(name);
      },

      /**
       * @required
       */
      getAttr: function($skin, name) {
        return $skin.getAttribute(name);
      },

      /**
       * @required
       */
      setAttr: function($skin, name, value) {
        return $skin.setAttribute(name, value);
      },

      /**
       * @required
       */
      removeAttr: function($skin, name) {
        return $skin.removeAttribute(name);
      },

      /**
       * @required
       */
      hasProp: function($skin, name) {
        return name in $skin;
      },

      /**
       * @required
       */
      getProp: function($skin, name) {
        return $skin[name];
      },

      /**
       * @required
       */
      setProp: function($skin, name, value) {
        $skin[name] = value;
      },

      /**
       * @required
       */
      removeProp: function($skin, name) {
        delete $skin[name];
      },

      getComputedStyleOf: function($skin) {
        return window.getComputedStyle($skin);
      },

      /**
       * @required
       */
      setStyleItem: function($skin, name, value) {
        //TODO: name = toCamelCase(name);
        $skin.style[name] = value;
      },

      /**
       * @required
       */
      removeStyleItem: function($skin, name) {
        $skin.style[name] = '';
      },

      normalize: function($skin) {
        $skin.normalize && $skin.normalize();
      },

      getChildrenNum: function($skin) {
        var children = Skin.getProp($skin, 'childNodes');// || Skin.getChildNodes(node);
        return children.length;
      },

      /**
       * @required
       */
      getChildrenCopy: function($skin) { // include texts and comments
        var copy = [], children = Skin.getProp($skin, 'childNodes');

        copy.push.apply(copy, children);

        return copy;
      },

      getChildAt: function($skin, index) {
        return Skin.getProp($skin, 'childNodes')[index];
      },
      
      /**
       * @required
       */
      getParent: function($skin) { // unnecessary, use `getProp`
        return $skin.parentNode;
      },

      /**
       * @required
       */
      appendChild: function($skin, child) {
        return $skin.appendChild(child);
      },

      /**
       * @required
       */
      insertChild: function($skin, child, before) {
        return $skin.insertBefore(child, before);
      },

      /**
       * @required
       */
      replaceChild: function($skin, child, existed) {
        return $skin.replaceChild(child, existed);
      },

      /**
       * @required
       */
      removeChild: function($skin, child) {
        return $skin.removeChild(child);
      },

      removeAllChildren: function($skin) {
        Skin.setProp($skin, 'textContent', '');
      },

      query: function($skin, selector) { //find
        return $skin.querySelector(selector); //TODO: getElementById...
      },

      queryAll: function($skin, selector) { //select
        return $skin.querySelectorAll(selector); //TODO: getElementsByTag...
      },

      /**
       * @required
       */
      mayDispatchEvent: function($skin, type) {//TODO: mayDispatchEvent
        return ('on' + type) in $skin;
      },

      /**
       * @required
       */
      getFixedEvent: function(event) {
        event = event || window.event;

        if (!event.target) {
          event.target = event.srcElement;
        }

        if (event.key) {
          event.keyName = event.key[0].toLowerCase() + event.key.slice(1);
        }

        //TODO: timeStamp, not here

        if (!preventDefault) { // TODO:
          decideEventMethods(event);
        }

        event.preventDefault = preventDefault;
        event.stopPropagation = stopPropagation;
        event.stopImmediatePropagation = stopImmediatePropagation;

        return event;
      },

      /**
       * @required
       */
      addEventListener: function($skin, type, listener, useCapture) {
        if ($skin.addEventListener) {
          $skin.addEventListener(type, listener, useCapture);
        } else if ($skin.attachEvent) {
          $skin.attachEvent('on' + type, listener/*, useCapture*/);
        }
      },

      /**
       * @required
       */
      removeEventListener: function($skin, type, listener, useCapture) {
        if ($skin.removeEventListener) {
          $skin.removeEventListener(type, listener, useCapture);
        } else if ($skin.detachEvent) {
          $skin.detachEvent('on' + type, listener/*, useCapture*/);
        }
      },

      delegateEventListener: function(type, listener, useCapture) {
        if (delegatedEvents[type]) { return; }

        Skin.addEventListener(doc, type, listener, useCapture);

        delegatedEvents[type] = true;
      },

      /**
       * @required
       */
      renderAttrs: function($skin, attrs, dirty) {
        var key, value;

        if (!dirty) { return; }

        for (key in dirty) {
          if (!dirty.hasOwnProperty(key)) {
            continue;
          }

          value = attrs[key];

          if (typeof value === 'string') {
            Skin.setAttr($skin, key, value);
          } else if (value === undefined && Skin.hasAttr($skin, key)) {
            Skin.removeAttr($skin, key);
          }
        }
      },

      /**
       * @required
       */
      renderProps: function($skin, props, dirty) {
        var key, value;

        if (!dirty) { return; }

        for (key in dirty) {
          if (dirty.hasOwnProperty(key) && Skin.hasProp($skin, key)) {
            value = props[key];

            if (value !== undefined) {
              Skin.setProp($skin, key, value);
            } else {
              Skin.removeProp($skin, key);
            }
          }
        }
      },

      /**
       * @required
       */
      renderStyle: function($skin, style, dirty) {
        var key, value;

        if (!dirty) { return; }

        for (key in dirty) {
          if (dirty.hasOwnProperty(key)) {
            value = style[key];

            if (value) {
              Skin.setStyleItem($skin, key, value);
            } else {
              Skin.removeStyleItem($skin, key);
            }
          }
        }

      },

      /**
       * @required
       */
      renderClasses: function($skin, classes, dirty) {
        var key, names = [];

        if (!dirty) { return; }

        for (key in dirty) {
          if (dirty.hasOwnProperty(key) && classes[key]) {
            names.push(key);
          }
        }

        Skin.setProp($skin, 'className', names.join(' '));
      },

      /**
       * @required
       */
      renderChildren: function($skin, $children) {
        var i, n, m, $child, $existed, $removed;

        m = Skin.getChildrenNum($skin);
        n = $children.length;

        for (i = 0; i < n; ++i) {
          if (Skin.canExtend($children[i])) {
            $children[i]._toIndex = i; //
          }
        }

        $removed = [];
        for (i = m - 1; i >= 0; --i) {
          $child = Skin.getChildAt($skin, i);
          if (Skin.canExtend($skin) && ('_toIndex' in $child)) {
            //delete $child._toIndex;
          } else if ($child) {
            Skin.removeChild($skin, $child);
            $removed.push($child);
          }
        }

        for (i = 0; i < n; ++i) { //TODO: fragment
          $child = $children[i];
          $existed = Skin.getChildAt($skin, i);

          if ($existed) {
            if ($child !== $existed) {
              Skin.insertChild($skin, $child, $existed);
            }
          } else {
            Skin.appendChild($skin, $child);
          }

          delete $child._toIndex;
        }

        return $removed;
      }
    }

  });

  Exact.Skin = Skin;

})();
