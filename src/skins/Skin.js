//######################################################################################################################
// src/skins/Skin.js
//######################################################################################################################
(function() {

  var MUST_USE_PROPERTY = 0x1;
  var HAS_BOOLEAN_VALUE = 0x2;
  // PROPERTIES, modified from React (https://facebook.github.io/react/)
  var PROPERTIES = {
    /**
     * Standard Properties
     */
    accept: 0,
    acceptCharset: 0,
    accessKey: 0,
    action: 0,
    allowFullScreen: HAS_BOOLEAN_VALUE,
    allowTransparency: 0,
    alt: 0,
    async: HAS_BOOLEAN_VALUE,
    autoComplete: 0,
    autoFocus: HAS_BOOLEAN_VALUE,
    autoPlay: HAS_BOOLEAN_VALUE,
    capture: HAS_BOOLEAN_VALUE,
    cellPadding: 0,
    cellSpacing: 0,
    charSet: 0,
    challenge: 0,
    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    cite: 0,
    classID: 0,
    className: 0,
    cols: 0,//HAS_POSITIVE_NUMERIC_VALUE,
    colSpan: 0,
    content: 0,
    contentEditable: 0,
    contextMenu: 0,
    controls: HAS_BOOLEAN_VALUE,
    coords: 0,
    crossOrigin: 0,
    data: MUST_USE_PROPERTY, // For `<object />` acts as `src`, and TextNode.
    dateTime: 0,
    'default': HAS_BOOLEAN_VALUE,
    defer: HAS_BOOLEAN_VALUE,
    dir: 0,
    disabled: HAS_BOOLEAN_VALUE,
    download: 0,//HAS_OVERLOADED_BOOLEAN_VALUE,
    draggable: 0,
    encType: 0,
    form: 0,
    formAction: 0,
    formEncType: 0,
    formMethod: 0,
    formNoValidate: HAS_BOOLEAN_VALUE,
    formTarget: 0,
    frameBorder: 0,
    headers: 0,
    height: 0,
    hidden: HAS_BOOLEAN_VALUE,
    high: 0,
    href: 0,
    hrefLang: 0,
    htmlFor: 0,
    httpEquiv: 0,
    icon: 0,
    id: 0,
    // innerHTML
    innerHTML: MUST_USE_PROPERTY,
    inputMode: 0,
    integrity: 0,
    is: 0,
    keyParams: 0,
    keyType: 0,
    kind: 0,
    label: 0,
    lang: 0,
    list: 0,
    loop: HAS_BOOLEAN_VALUE,
    low: 0,
    manifest: 0,
    marginHeight: 0,
    marginWidth: 0,
    max: 0,
    maxLength: 0,
    media: 0,
    mediaGroup: 0,
    method: 0,
    min: 0,
    minLength: 0,
    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    name: 0,
    nonce: 0,
    noValidate: HAS_BOOLEAN_VALUE,
    open: HAS_BOOLEAN_VALUE,
    optimum: 0,
    pattern: 0,
    placeholder: 0,
    poster: 0,
    preload: 0,
    profile: 0,
    radioGroup: 0,
    readOnly: HAS_BOOLEAN_VALUE,
    referrerPolicy: 0,
    rel: 0,
    required: HAS_BOOLEAN_VALUE,
    reversed: HAS_BOOLEAN_VALUE,
    role: 0,
    rows: 0,//HAS_POSITIVE_NUMERIC_VALUE,
    rowSpan: 0,//HAS_NUMERIC_VALUE,
    sandbox: 0,
    scope: 0,
    scoped: HAS_BOOLEAN_VALUE,
    scrolling: 0,
    seamless: HAS_BOOLEAN_VALUE,
    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    shape: 0,
    size: 0,//HAS_POSITIVE_NUMERIC_VALUE,
    sizes: 0,
    span: 0,//HAS_POSITIVE_NUMERIC_VALUE,
    spellCheck: 0,
    src: 0,
    srcDoc: 0,
    srcLang: 0,
    srcSet: 0,
    start: 0,//HAS_NUMERIC_VALUE,
    step: 0,
    style: 0,
    summary: 0,
    tabIndex: 0,
    target: 0,
    title: 0,
    type: 0,
    useMap: 0,
    value: MUST_USE_PROPERTY,
    width: 0,
    wmode: 0,
    wrap: 0,

    /**
     * RDFa Properties
     */
    about: 0,
    datatype: 0,
    inlist: 0,
    prefix: 0,
    property: 0,
    resource: 0,
    'typeof': 0,
    vocab: 0,

    /**
     * Non-standard Properties
     */
    autoCapitalize: 0,
    autoCorrect: 0,
    autoSave: 0,
    color: 0,
    itemProp: 0,
    itemScope: HAS_BOOLEAN_VALUE,
    itemType: 0,
    itemID: 0,
    itemRef: 0,
    results: 0,
    security: 0,
    unselectable: 0
  };

  var JS_TO_HTML = (function(map) {
    var key, cache = {};
    for (key in map) {
      if (map.hasOwnProperty(key)){
        cache[key] = key.toLowerCase();
      }
    }
    return cache;
  })(PROPERTIES);

  JS_TO_HTML.htmlFor = 'for';
  JS_TO_HTML.cssFloat = 'float';
  JS_TO_HTML.className = 'class';
  JS_TO_HTML.innerHTML = 'inner-html';

  var HTML_TO_JS = (function(map) {
    var key, cache = {};
    for (key in map) {
      if (map.hasOwnProperty(key)){
        cache[map[key]] = key;
      }
    }
    return cache;
  })(JS_TO_HTML);

  var namespaceURIs = {
    html: 'http://www.w3.org/1999/xhtml',
    math: 'http://www.w3.org/1998/Math/MathML',
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink'
  };

  var CSSVendorPrefix, CSSVendorPrefixes = ['webkit', 'Webkit', 'Moz', 'ms', 'O'];

  function checkCSSVendorPrefix($style, keyCapitalized) {
    for (var i = 0; i < CSSVendorPrefixes.length; ++i) {
      if ((CSSVendorPrefixes[i] + keyCapitalized) in $style) {
        return CSSVendorPrefixes[i];
      }
    }
  }

  var doc = window.document;

  var REGEXP_1 = /-([a-z])?/g;
  var REGEXP_2 = /([A-Z])/g;

  function toCamelCase(key) {
    return HTML_TO_JS[key] || key.replace(REGEXP_1, function(match, char) {
        return char ? char.toUpperCase() : '';
      });
  }

  function toKebabCase(key) {
    return JS_TO_HTML[key] || key.replace(REGEXP_2, function(match, char) {
        return '-' + char.toLowerCase();
      });
  }

  var Array$slice = Array.prototype.slice;

  function Skin() {
    var $skin = this, fn = arguments[0];

    if (fn && $skin[fn]) {
      return $skin[fn].apply($skin, Array$slice.call(arguments, 1));
    }
    //throw new Error('');
  }

  Exact.defineClass({
    constructor: Skin,

    statics: {
      /**
       * @required
       */
      toCamelCase: toCamelCase,

      /**
       * @required
       * @internal
       */
      toKebabCase: toKebabCase,

      /**
       * @required
       */
      isText: function isText($skin) {
        return $skin ? $skin.nodeType === 3 : false;
      },

      /**
       * @required
       */
      isComment: function isComment($skin) {
        return $skin ? $skin.nodeType === 8 : false;
      },

      /**
       * @required
       */
      isElement: function isElement($skin) {
        return $skin ? $skin.nodeType === 1 : false;
      },

      isFragment: function isFragment($skin) {
        return $skin ? $skin.nodeType === 11 : false;
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
        return !ns /*|| !doc.createElementNS*/ ? doc.createElement(tag) : doc.createElementNS(namespaceURIs[ns], tag);
      },

      //createFragment: function createFragment() {
      //  return doc.createDocumentFragment();
      //},

      /**
       * @required
       */
      parse: function parse(html) {
        var $parent, outerHtml;
        var i = html.indexOf(' ');
        var j = html.indexOf('>');
        var tag = html.slice(1, j < i ? j : i);

        i = html.lastIndexOf('xmlns', j);

        if (i > 0) {
          var nsURI = html.slice(i+7, html.indexOf('"', i+7));

          if (tag !== 'svg' && nsURI === namespaceURIs.svg) {
            outerHtml = '<svg xmlns="' + nsURI + '">' + html + '</svg>';
          } else if (tag !== 'math' && nsURI === namespaceURIs.math) {
            outerHtml = '<math xmlns="' + nsURI + '">' + html + '</math>';
          }
        }

        if (outerHtml) {
          $parent = PARENT_NODES.DIV;
          $parent.innerHTML = outerHtml;
          $parent = $parent.firstChild;
        } else {
          $parent = PARENT_NODES[CONTAINERS[tag] || 'DIV'];
          $parent.innerHTML = html;
        }

        $parent.normalize();

        return Skin.getChildren($parent);
      },


      /**
       * @required
       */
      getTagName: function getTagName(skin) {
        var tagName = skin.tagName; // Skin.getProp(skin, 'tagName');
        return tagName ? tagName.toLowerCase() : '';
      },

      /**
       * @required
       */
      getNameSpace: function getNameSpace($skin) {
        if (Skin.isElement($skin)) {
          var nsURI = $skin.namespaceURI || $skin.getAttribute('xmlns');

          if (!nsURI || nsURI === namespaceURIs.html) {
            return '';
          } else if (nsURI === namespaceURIs.svg) {
            return 'svg';
          } else if (nsURI === namespaceURIs.math) {
            return 'math';
          }
        }

        return '';
      },

      /**
       * @required
       */
      getAttrs: function getAttrs($skin) {
        if (Skin.isElement($skin) && $skin.hasAttributes()) {
          var attrs = {}, $attrs = $skin.attributes, $attr, name;

          for (var i = 0, n = $attrs.length; i < n; ++i) {
            $attr = $attrs[i];
            name = $attr.name;
            if (HTML_TO_JS.hasOwnProperty(name) && (PROPERTIES[HTML_TO_JS[name]] & HAS_BOOLEAN_VALUE)) {
              attrs[name] = 'true';
            } else {
              attrs[name] = $attr.value;
            }
          }

          return attrs;
        }
      },

      /**
       * @required
       */
      hasProp: function hasProp($skin, name) {
        return name in $skin;
      },

      /**
       * @required
       */
      getProp: function getProp($skin, name) {
        return $skin[name];
      },

      ///**
      // * @required
      // * @internal
      // */
      //setProp: function setProp($skin, name, value) {
      //  $skin[name] = value;
      //},

      //getComputedStyle: function getComputedStyle($skin) {
      //  return window.getComputedStyle($skin);
      //},

      /**
       * @required
       */
      getChildren: function getChildren($skin) { // include texts and comments, getChildrenCopy, getContents
        var $copy = [], $children = $skin.childNodes;// Skin.getProp($skin, 'childNodes');

        if ($children && $children.length) {
          $copy.push.apply($copy, $children);
        }

        return $copy;
      },

      /**
       * @required
       */
      getParent: function getParent($skin) {
        return $skin.parentNode;
      },

      /**
       * Get the shadow of the $skin
       *
       * @param {Node} $skin
       * @returns {Shadow}
       */
      getShadow: function getShadow($skin) {
        return $skin && $skin._shadow;
      },

      /**
       * Set the shadow of the $skin
       *
       * @param {Node} $skin
       * @param {Shadow} shadow
       */
      setShadow: function($skin, shadow) {
        if (shadow) {
          Object.defineProperty($skin, '_shadow', {
            value: shadow,
            writable: true,
            enumerable: false,
            configurable: true
          });
        } else {
          delete $skin._shadow;
        }
      },

      query: function query($skin, selector) {
        return $skin.querySelector(selector);
      },

      //queryAll: function queryAll($skin, selector) {
      //  return $skin.querySelectorAll(selector);
      //},

      /**
       * @required
       */
      mayDispatchEvent: function mayDispatchEvent($skin, type) {
        return ('on' + type) in $skin;
      },

      /**
       * @required
       */
      getFixedEvent: function getFixedEvent(event) {
        if (event.key) {
          event.keyName = event.key[0].toLowerCase() + event.key.slice(1);
        }

        return event;
      },

      /**
       * @required
       */
      addEventListener: function addEventListener($skin, type, listener, useCapture) {
        $skin.addEventListener(type, listener, useCapture);
      },

      /**
       * @required
       */
      removeEventListener: function removeEventListener($skin, type, listener, useCapture) {
        $skin.removeEventListener(type, listener, useCapture);
      },

      /**
       * @required
       */
      renderAttrs: function renderAttrs($skin, attrs, dirty) {
        var key, value, index, nsURI;
        //if (!dirty) { return; }
        for (key in dirty) {
          if (!dirty.hasOwnProperty(key)) { continue; }

          value = attrs[key];
          index = key.indexOf(':');

          if (index > 0) {
            nsURI = namespaceURIs[key.slice(0, index)];
          }

          if (!nsURI) {
            if (value != null) {
              $skin.setAttribute(key, value);
            } else {
              $skin.removeAttribute(key);
            }
          } else {
            key = key.slice(index + 1);

            if (value != null) {
              $skin.setAttributeNS(nsURI, key, value);
            } else {
              $skin.removeAttributeNS(nsURI, key);
            }
          }
        }
      },

      /**
       * @required
       */
      renderProps: function renderProps($skin, props, dirty) {
        var key, value;
        //if (!dirty) { return; }
        for (key in dirty) {
          if (!dirty.hasOwnProperty(key)) { continue; }

          value = props[key];

          if (PROPERTIES[key]) { // MUST_USE_PROPERTY or HAS_BOOLEAN_VALUE
            $skin[key] = value;
          } else if (value == null) { // null or undefined
            $skin.removeAttribute(toKebabCase(key));
          } else if (Skin.hasProp($skin, key)) {
            $skin.setAttribute(toKebabCase(key), value);
          }
        }
      },

      /**
       * @required
       */
      renderStyle: function renderStyle($skin, style, dirty) {
        var key, $style = $skin.style;
        //if (!dirty) { return; }
        for (key in dirty) {
          if (!dirty.hasOwnProperty(key)) { continue; }

          if (key in $style) {
            $style[key] = style[key];
          } else {
            var keyCapitalized = key.charAt(0).toUpperCase() + key.slice(1);

            if (!CSSVendorPrefix) {
              CSSVendorPrefix = checkCSSVendorPrefix($style, keyCapitalized);
            }

            if (CSSVendorPrefix) {
              $style[CSSVendorPrefix + keyCapitalized] = style[key];
            }
          }
        }
      },

      /**
       * @required
       */
      renderClasses: function renderClasses($skin, classes, dirty) {
        var key, classList = $skin.classList;
        //if (!dirty) { return; }
        if (classList) {
          for (key in dirty) {
            if (!dirty.hasOwnProperty(key)) { continue; }

            if (classes[key]) {
              classList.add(key);
            } else {
              classList.remove(key);
            }
          }
        } else {
          var names = [];

          for (key in dirty) {
            if (dirty.hasOwnProperty(key) && classes[key]) {
              names.push(key);
            }
          }

          $skin.setAttribute('class', names.join(' '));
        }
      },

      /**
       * @required
       */
      renderChildren: function renderChildren($skin, children) {
        var i, n, m, $child, $existed, $removed, $children = $skin.childNodes;

        n = children.length;

        if (n) {
          for (i = 0; i < n; ++i) {
            $existed = $children[i];
            $child = children[i].$skin;

            if (!$existed) {
              $skin.appendChild($child);
            } else if ($child !== $existed) {
              $skin.insertBefore($child, $existed);
            }
          }
        }

        m = $children.length;

        if (n < m) {
          $removed = [];
          for (i = m - 1; i >= n; --i) {
            $existed = $children[i];
            $removed.push($existed);
            $skin.removeChild($existed);
          }
        }

        return $removed;
      }
    }

  });

  var CONTAINERS = {
    area: 'MAP',
    param: 'OBJECT',
    legend: 'FIELDSET',
    option: 'SELECT', optgroup: 'SELECT',
    tr: 'TBODY', 'td': 'TR', 'th': 'TR', col: 'COLGROUP',
    tbody: 'TABLE', thead: 'TABLE', tfoot: 'TABLE', caption: 'TABLE', colgroup: 'TABLE'

  };

  var PARENT_NODES = {
    DIV: Skin.createElement('div'),
    MAP: Skin.createElement('map'),
    //'svg': Skin.createElement('svg', 'svg'),
    //'math': Skin.createElement('math', 'math'),
    TR: Skin.createElement('tr'),
    TABLE: Skin.createElement('table'),
    TBODY: Skin.createElement('tbody'),
    SELECT: Skin.createElement('select'),
    OBJECT: Skin.createElement('object'),
    COLGROUP: Skin.createElement('colgroup'),
    FIELDSET: Skin.createElement('fieldset')
  };

  Exact.Skin = Skin;

})();
