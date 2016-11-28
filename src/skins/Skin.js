//######################################################################################################################
// src/skins/Skin.js
//######################################################################################################################
(function() {

  'use strict';
//TODO: 分解
  var ObjectUtil = Exact.ObjectUtil;

  var PROPS_SHOULD_BE_USED = {
    'data': true//, 'value': true, 'checked': true, 'selected': true, 'muted': true, 'multiple': true
  };

  var FIX_KEYS_FROM_JS_TO_HTML = (function(names) {
    var key, map = {};
    for (var i = 0, n = names.length; i < n; ++i) {
      key = names[i];
      map[key] = key.toLowerCase();
    }
    return map;
  })([
    'accessKey', 'allowFullScreen', 'allowTransparency', 'autoCapitalize', 'autoComplete', 'autoCorrect', 'autoPlay', 'autoSave',
    'cellPadding', 'cellSpacing', 'charSet', 'classID', 'colSpan', 'contentEditable', 'contextMenu', 'crossOrigin',
    'dateTime',
    'encType',
    'formAction', 'formEncType', 'formMethod', 'formNoValidate', 'formTarget', 'frameBorder',
    'hrefLang',
    'inputMode', 'itemID', 'itemProp', 'itemRef', 'itemType',
    'keyParams', 'keyType',
    'marginHeight', 'marginWidth', 'maxLength', 'mediaGroup',
    'noValidate',
    'radioGroup', 'readOnly', 'referrerPolicy', 'rowSpan',
    'spellCheck', 'srcDoc', 'srcLang', 'srcSet',
    'tabIndex',
    'useMap'//TODO: ...
  ]);

  ObjectUtil.assign(
    FIX_KEYS_FROM_JS_TO_HTML,
    {
      'htmlFor': 'for',
      'cssFloat': 'float',
      'className': 'class'
    }
  );

  var FIX_KEYS_FROM_HTML_TO_JS = (function(map) {
    var key, obj = {};
    for (key in map) {
      if (map.hasOwnProperty(key)){
        obj[map[key]] = key;
      }
    }
    return obj;
  })(FIX_KEYS_FROM_JS_TO_HTML);

  var camelCaseCache = ObjectUtil.assign({}, FIX_KEYS_FROM_HTML_TO_JS);
  var kebabCaseCache = ObjectUtil.assign({}, FIX_KEYS_FROM_JS_TO_HTML);

  var namespaceURIs = {
    svg: 'http://www.w3.org/2000/svg',
    html: 'http://www.w3.org/1999/xhtml',
    math: 'http://www.w3.org/1998/Math/MathML'
  };

  var cssVendorPrefix = '';

  var doc = window.document;

  // In IE 8, text node is not extensible
  var textIsExtensible = true, text = doc.createTextNode(' ');
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

  function Skin() {
    throw new Error('');
  }

  Exact.defineClass({
    constructor: Skin,

    statics: {
      /**
       * @required
       */
      toCamelCase: function toCamelCase(key) {
        if (!(key in camelCaseCache)) {
          //key.replace(/-(.)?/g, function(match, char) {
          camelCaseCache[key] = key.replace(/-([a-z])?/g, function(match, char) {
            return char ? char.toUpperCase() : '';
          });
        }

        return camelCaseCache[key];
      },

      toKebabCase: function toKebabCase(key) {
        if (!(key in kebabCaseCache)) {
          //key.replace(/-(.)?/g, function(match, char) {
          kebabCaseCache[key] = key.replace(/([A-Z])/g, function(match, char) {
            return '-' + char.toLowerCase();
          });
        }

        return kebabCaseCache[key];
      },
      //
      //textIsExtensible: function() {
      //  return textIsExtensible;
      //},

      /**
       * @required
       */
      canExtend: function canExtend($skin) {
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
      isText: function isText($skin) {
        return $skin && $skin.nodeType === 3;
      },

      /**
       * @required
       */
      isComment: function isComment($skin) {
        return $skin && $skin.nodeType === 8;
      },

      /**
       * @required
       */
      isElement: function isElement($skin) {
        return $skin && $skin.nodeType === 1;
      },

      isFragment: function isFragment($skin) {
        return $skin && $skin.nodeType === 11;
      },

      /**
       * @required
       */
      createText: function createText(data) {
        return doc.createTextNode(data);
      },

      /**
       * @required
       */
      createElement: function createElement(tag, ns) {//TODO: cache, clone
        return !ns || !doc.createElementNS ? doc.createElement(tag) : doc.createElementNS(namespaceURIs[ns], tag);
      },

      createFragment: function createFragment() {
        return doc.createDocumentFragment();
      },

      /**
       * @required
       */
      parse: function parse(html) {
        var i = html.indexOf(' ');
        var j = html.indexOf('>');
        var tag = html.slice(1, j < i ? j : i);
        var type;

        i = html.lastIndexOf('xmlns', j);
        if (i > 0) {
          var nsURI = html.slice(i+7, html.indexOf('"', i+7));
          if (nsURI === namespaceURIs.svg) {
            type = 'svg';
          } else if (nsURI === namespaceURIs.math) {
            type = 'math';
          }
        }

        if (!type) {
          type = containers[tag] || 'div';
        }

        var parent = parents[type];

        parent.innerHTML = html;

        return Skin.getChildrenCopy(parent);
      },

      clone: function clone($skin) {
        return $skin.cloneNode(true);
      },

      /**
       * @required
       */
      focus: function focus($skin) {
        return $skin.focus();
      },

      /**
       * @required
       */
      blur: function blur($skin) {
        return $skin.blur();
      },

      /**
       * @required
       */
      getNameSpace: function getNameSpace($skin) {
        var nsURI = Skin.getAttr($skin, 'xmlns') || Skin.getProp($skin, 'namespaceURI');

        if (nsURI === namespaceURIs.html) {
          return '';
        } else if (nsURI === namespaceURIs.svg) {
          return 'svg';
        } else if (nsURI === namespaceURIs.math) {
          return 'math';
        }
      },

      /**
       * @required
       */
      hasAttrs: function hasAttrs($skin) {
        return $skin.hasAttributes ? $skin.hasAttributes() : ($skin.attributes && $skin.attributes.length > 0);
      },

      /**
       * @required
       */
      getAttrs: function getAttrs($skin) {
        if ($skin._attrs) {
          return $skin._attrs;
        }

        if (Skin.isElement($skin)) {
          var attrs = {}, $attrs = $skin.attributes, $attr;

          for (var i = 0, n = $attrs.length; i < n; ++i) {
            $attr = $attrs[i];
            attrs[$attr.name] = $attr.value;
          }

          $skin._attrs = attrs;
          //return $skin.attributes;
          return attrs;
        }
      },

      /**
       * @required
       */
      hasAttr: function hasAttr($skin, name) {
        return $skin.hasAttribute(name);
      },

      /**
       * @required
       */
      getAttr: function getAttr($skin, name) {
        return $skin.getAttribute(name);
      },

      /**
       * @required
       */
      setAttr: function setAttr($skin, name, value) {
        var type = typeof value;

        if (type === 'boolean') {
          if (value) {
            $skin.setAttribute(name, '');
          } else {
            $skin.removeAttribute(name);
          }
        } else {
          $skin.setAttribute(name, value);
        }
      },

      /**
       * @required
       */
      removeAttr: function removeAttr($skin, name) {
        return $skin.removeAttribute(name);
      },


      hasProp: function hasProp($skin, name) {
        return name in $skin;
      },

      /**
       * @required
       */
      getProp: function getProp($skin, name) {
        return $skin[name];
      },

      /**
       * @required
       */
      setProp: function setProp($skin, name, value) {
        //console.log($skin, $skin[name], Object.getOwnPropertyDescriptor($skin, name));
        $skin[name] = value;
      },

      /**
       * @required
       */
      removeProp: function removeProp($skin, name) {
        delete $skin[name];
      },

      getComputedStyle: function getComputedStyle($skin) {
        return window.getComputedStyle($skin);
      },

      /**
       * @required
       */
      setStyleProp: function setStyleProp($skin, name, value) {
        //TODO: name = toCamelCase(name);
        $skin.style[name] = value;

        if (name in $skin.style) {
          $skin.style[name] = value;
        } else {
          var capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

          if (!cssVendorPrefix) {
            var cssVendorPrefixes = ['webkit', 'Webkit', 'Moz', 'ms', 'O'];

            for (var i = 0; i < 5; ++i) {
              if ((cssVendorPrefixes[i] + capitalizedName) in $skin.style) {
                cssVendorPrefix = cssVendorPrefixes[i];
                break;
              }
            }
          }

          $skin.style[cssVendorPrefix + capitalizedName] = value;
        }


      },

      /**
       * @required
       */
      removeStyleProp: function removeStyleProp($skin, name) {
        $skin.style[name] = '';
      },

      normalize: function normalize($skin) {
        $skin.normalize && $skin.normalize();
      },

      getChildrenNum: function getChildrenNum($skin) {
        var children = Skin.getProp($skin, 'childNodes');// || Skin.getChildNodes(node);
        return children.length;
      },

      /**
       * @required
       */
      getChildrenCopy: function getChildrenCopy($skin) { // include texts and comments
        var copy = [], children = Skin.getProp($skin, 'childNodes');

        copy.push.apply(copy, children);

        return copy;
      },

      getChildAt: function getChildAt($skin, index) {
        return Skin.getProp($skin, 'childNodes')[index];
      },
      
      /**
       * @required
       */
      getParent: function getParent($skin) { // unnecessary, use `getProp`
        return $skin.parentNode;
      },

      /**
       * @required
       */
      appendChild: function appendChild($skin, child) {
        return $skin.appendChild(child);
      },

      /**
       * @required
       */
      insertChild: function insertChild($skin, child, before) {
        return $skin.insertBefore(child, before);
      },

      /**
       * @required
       */
      replaceChild: function replaceChild($skin, child, existed) {
        return $skin.replaceChild(child, existed);
      },

      /**
       * @required
       */
      removeChild: function removeChild($skin, child) {
        return $skin.removeChild(child);
      },

      removeAllChildren: function removeAllChildren($skin) {
        Skin.setProp($skin, 'textContent', '');
      },

      query: function query($skin, selector) { //find
        return $skin.querySelector(selector); //TODO: getElementById...
      },

      queryAll: function queryAll($skin, selector) { //select
        return $skin.querySelectorAll(selector); //TODO: getElementsByTag...
      },

      /**
       * @required
       */
      mayDispatchEvent: function mayDispatchEvent($skin, type) {//TODO: mayDispatchEvent
        return ('on' + type) in $skin;
      },

      /**
       * @required
       */
      getFixedEvent: function getFixedEvent(event) {
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
      addEventListener: function addEventListener($skin, type, listener, useCapture) {
        if ($skin.addEventListener) {
          $skin.addEventListener(type, listener, useCapture);
        } else if ($skin.attachEvent) {
          $skin.attachEvent('on' + type, listener/*, useCapture*/);
        }
      },

      /**
       * @required
       */
      removeEventListener: function removeEventListener($skin, type, listener, useCapture) {
        if ($skin.removeEventListener) {
          $skin.removeEventListener(type, listener, useCapture);
        } else if ($skin.detachEvent) {
          $skin.detachEvent('on' + type, listener/*, useCapture*/);
        }
      },

      /**
       * @required
       */
      renderAttrs: function renderAttrs($skin, attrs, dirty) {
        var key, value;

        if (!dirty) { return; }

        for (key in dirty) {
          if (!dirty.hasOwnProperty(key)) {
            continue;
          }

          value = attrs[key];

          if (value == undefined/* && Skin.hasAttr($skin, key)*/) {
            Skin.removeAttr($skin, key);
          } else {
            Skin.setAttr($skin, key, value);
          }
        }
      },

      /**
       * @required
       */
      renderProps: function renderProps($skin, props, dirty, sealed) {
        var key, value;

        if (!dirty) { return; }

        for (key in dirty) {
          if (!dirty.hasOwnProperty(key)) {
            continue;
          }

          value = props[key];

          if (key in PROPS_SHOULD_BE_USED) {
            Skin.setProp($skin, key, value);
          } else if (value == undefined) { // null or undefined
            Skin.removeAttr($skin, Skin.toKebabCase(key));
          } else if (!sealed || (Skin.hasProp($skin, key) /*&& typeof value !== 'object'*/)) {
            Skin.setAttr($skin, Skin.toKebabCase(key), value);
          }
        }
      },

      /**
       * @required
       */
      renderStyle: function renderStyle($skin, style, dirty) {
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

      /**
       * @required
       */
      renderClasses: function renderClasses($skin, classes, dirty) {
        var key, names = [];

        if (!dirty) { return; }

        for (key in dirty) {
          if (dirty.hasOwnProperty(key) && classes[key]) {
            names.push(key);
          }
        }

        Skin.setProp($skin, 'className', names.join(' '));
        //Skin.setAttr($skin, 'class', names.join(' '));
      },

      /**
       * @required
       */
      renderChildren: function renderChildren($skin, $children) {
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

  var containers = {
    'option': 'select',
    'tbody': 'table', 'thead': 'table', 'tfoot': 'table', 'tr': 'tbody', 'td': 'tr', 'th': 'tr'
  };

  var parents = {
    'div': Skin.createElement('div'),
    'svg': Skin.createElement('svg', namespaceURIs.svg),
    'math': Skin.createElement('div', namespaceURIs.math),

    'tr': Skin.createElement('tr'),
    'table': Skin.createElement('table'),
    'tbody': Skin.createElement('tbody'),
    'select': Skin.createElement('select')
  };

  Exact.Skin = Skin;

})();
