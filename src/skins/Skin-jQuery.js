//######################################################################################################################
// src/skins/SkinJQuery.js
//######################################################################################################################
(function() {

  'use strict';

  var $ = jQuery;

  var FIX_KEYS = {'for': 'htmlFor', 'class': 'className', 'float': 'cssFloat'};

  //var doc = window.document, $doc = $(doc),
  //  table = doc.createElement('table'),
  //  tableRow = doc.createElement('tr');

  //var containers = {
  //  '*': doc.createElement('div'),
  //  'option': doc.createElement('select'),
  //  'tr': doc.createElement('tbody'),
  //  'td': tableRow, 'th': tableRow,
  //  'tbody': table, 'thead': table, 'tfoot': table
  //};
  //TODO: option in select

  //IE 8
  var textIsExtensible = true, text = document.createTextNode(' ');
  try {
    text.hasOwnProperty('nodeValue');
    text._toIndex = -1;
  } catch (error) {
    textIsExtensible = false;
  }


  var
    preventDefault, _preventDefault,
    stopPropagation, _stopPropagation,
    stopImmediatePropagation, _stopImmediatePropagation;

  function decideMethodsOf(event) {
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

      isText: function($skin) {
        return $skin && $skin[0].nodeType === 3;
      },

      isComment: function($skin) {
        return $skin && $skin[0].nodeType === 8;
      },

      isElement: function($skin) {
        return $skin && $skin[0].nodeType === 1;
      },

      isFragment: function($skin) {
        return $skin && $skin[0].nodeType === 11;
      },

      createText: function(data) {
        return  $('<span></span>').text(data).contents().eq(0);
      },

      createElement: function(tag) {
        return $('<'+tag+'>').eq(0);
      },

      //createFragment: function() {//TODO:
      //  return doc.createDocumentFragment();
      //},

      parse: function(html) {
        return [$(html).eq(0)];
      },

      clone: function($skin) {
        return $skin.clone(true);
      },

      focus: function($skin) { //TODO
        return $skin[0].focus();
      },

      blur: function($skin) { //TODO
        return $skin[0].blur();
      },

      hasAttrs: function($skin) {
        return $skin[0].hasAttributes ? $skin[0].hasAttributes() : ($skin[0].attributes && $skin[0].attributes.length > 0);
      },

      getAttrs: function($skin) {
        //return $skin[0].attributes;
        if ($skin._attrs) {
          return $skin._attrs;
        }

        if (Skin.isElement($skin)) {
          var attrs = {}, $attrs = $skin[0].attributes, $attr;

          for (var i = 0, n = $attrs.length; i < n; ++i) {
            $attr = $attrs[i];
            attrs[$attr.name] = $attr.value;
          }

          $skin._attrs = attrs;
          //return $skin.attributes;
          return attrs;
        }
      },

      hasAttr: function($skin, name) {
        return $skin[0].hasAttribute(name);
      },

      getAttr: function($skin, name) {
        return $skin.attr(name);
      },

      setAttr: function($skin, name, value) {
        return $skin.attr(name, value);
      },

      removeAttr: function($skin, name) {
        return $skin.removeAttr(name);
      },

      hasProp: function($skin, name) {
        return name in $skin[0];
      },

      getProp: function($skin, name) {
        return Skin.isElement($skin) ? $skin.prop(name) : $skin[0][name];
      },

      setProp: function($skin, name, value) {
        if (Skin.isElement($skin)) {
          $skin.prop(name, value);
        } else {
          $skin[0][name] = value;
        }
      },

      removeProp: function($skin, name) { //TODO:
        delete $skin[0][name];
      },

      getComputedStyleOf: function($skin) {//TODO:
        return  window.getComputedStyle($skin[0]);
      },

      setStyleProp: function($skin, name, value) {
        //TODO: name = toCamelCase(name);
        $skin.css(name, value);
      },

      removeStyleProp: function($skin, name) {
        $skin.css(name, '');
      },

      normalize: function($skin) {
        $skin[0].normalize && $skin[0].normalize();
      },

      getChildren: function($skin) {
        //return $skin[0].childNodes;
        return $skin.contents().toArray().map(function(content) {
          return $(content);
        });
      },

      getChildrenNum: function($skin) {
        return Skin.getChildren($skin).length;//Skin.getProp($skin, 'childNodes').length;
      },

      getChildrenCopy: function($skin) { // include texts and comments
        var copy = [], children = Skin.getChildren($skin);//Skin.getProp($skin, 'childNodes');

        copy.push.apply(copy, children);

        return copy;
      },

      getChildAt: function($skin, index) {
        return Skin.getChildren($skin)[index];//$(Skin.getProp($skin, 'childNodes')[index]);
      },

      getParent: function($skin) { // unnecessary, use `getProp`
        return $skin.parent();
      },

      appendChild: function($skin, child) {
        return $skin.append(child);
      },

      insertChild: function($skin, child, before) {
        return child.insertBefore(before);
      },

      replaceChild: function($skin, child, existed) {
        return existed.replaceWith(child);
      },

      removeChild: function($skin, child) {
        return child.detach();//$skin.removeChild(child);
      },

      removeAllChildren: function($skin) {
        //Skin.setTextContent($skin, '');
        $skin.empty();
      },

      query: function($skin, selector) { //find
        return $skin.find(selector).eq(0); //TODO: getElementById...
      },

      queryAll: function($skin, selector) { //select
        return $skin.find(selector); //TODO: getElementsByTag...
      },

      mayDispatchEvent: function($skin, type) {//TODO: mayDispatchEvent
        return ('on' + type) in $skin[0];
      },

      getFixedEvent: function(event) {
        event = event || window.event;

        if (!event.target) {
          event.target = event.srcElement;
        }

        if (event.key) {
          //var key = event.key;
          event.keyName = event.key[0].toLowerCase() + event.key.slice(1);
        }

        //TODO: timeStamp, not here

        if (!preventDefault) { // TODO:
          decideMethodsOf(event);
        }

        event.preventDefault = preventDefault;
        event.stopPropagation = stopPropagation;
        event.stopImmediatePropagation = stopImmediatePropagation;

        return event;
      },

      addEventListener: function($skin, type, listener, useCapture) {
        $skin.on(type, listener);
      },

      removeEventListener: function($skin, type, listener, useCapture) {
        $skin.off(type, listener);
      },

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

      renderStyle: function($skin, style, dirty) {
        var key, value;

        if (!dirty) { return; }

        for (key in dirty) {
          if (dirty.hasOwnProperty(key)) {
            value = style[key];

            if (value) {
              Skin.setStyleProp($skin, key, value);
            } else {
              Skin.removeStyleProp($skin, key);
            }
          }
        }

      },

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
