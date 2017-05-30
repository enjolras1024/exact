//######################################################################################################################
// src/skins/SkinJQuery.js
//######################################################################################################################
(function(global, module) {

  var $ = require('cheerio');

  if (typeof $ === 'undefined') {
    throw new Error('cheerio is required');
  }

  function assign(target/*,..sources*/) { // Object.assign
    if (target == null) {
      throw  new TypeError('Cannot convert undefined or null to object');
    }

    //if (!(target instanceof Object)) {
    //  var type = typeof target;
    //
    //  if (type === 'number') {
    //    target = new Number(target);
    //  } else if (type === 'string') {
    //    target = new String(target);
    //  } else if (type === 'boolean') {
    //    target = new Boolean(target);
    //  }
    //}

    var source, key, i, n = arguments.length;

    for (i = 1; i < n; ++i) {
      source = arguments[i];

      if (!(source instanceof Object)) {
        continue;
      }

      for (key in source) {
        if (source.hasOwnProperty(key)) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        }
      }
    }

    return target;
  }

  //var FIX_KEYS = {'for': 'htmlFor', 'class': 'className', 'float': 'cssFloat'};
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
    var $skin = this[0], fn = arguments[0];

    if (fn && $skin[fn]) {
      return $skin[fn].apply($skin, Array$slice.call(arguments, 1));
    }
  }

  assign(Skin, {
    version: '0.0.9',

    toCamelCase: toCamelCase,
    toKebabCase: toKebabCase,

    isText: function($skin) {
      return $skin && !$skin[0].name && $skin[0].type === 'text';
    },

    isComment: function($skin) {
      return $skin && !$skin[0].name &&  $skin[0].type === 'comment';
    },

    isElement: function($skin) {
      return $skin && $skin[0].name &&  $skin[0].type === 'tag';
    },

    createText: function(data) {
      return  $('<span></span>').text(data ? data: ' ').contents().eq(0);
    },

    createElement: function(ns, tag, type) {
      if (ns) {
        var html;

        if (ns === 'svg' && tag !== 'svg') {
          html = '<svg xmlns="' + namespaceURIs.svg +'"><' + tag + '></' + tag + '></svg>';
        } else if (ns === 'math' && tag !== 'math') {
          html = '<math xmlns="' + namespaceURIs.math +'"><' + tag + '></' + tag + '></math>';
        }

        if (html) {
          return $(html).contents().eq(0);
        }
      }

      return $('<' + tag + (type ? ' type="' + type + '"' : '') + '>').eq(0);
    },

    parse: function(html) {
      var outerHtml;
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

        if (outerHtml) {
          return [$(outerHtml).contents().eq(0)];
        }
      }

      return [$(html).eq(0)];
    },

    /**
     * @required
     */
    getTagName: function getTag($skin) {
      return Skin.isElement($skin) ? $skin.prop('tagName').toLowerCase() : '';
    },

    /**
     * @required
     */
    getNameSpace: function getNameSpace($skin) {
      var nsURI = $skin.prop('namespaceURI') || $skin.attr('xmlns');

      if (!nsURI || nsURI === namespaceURIs.html) {
        return '';
      } else if (nsURI === namespaceURIs.svg) {
        return 'svg';
      } else if (nsURI === namespaceURIs.math) {
        return 'math';
      }
      //return '';
    },

    getAttrs: function($skin) {
      if (Skin.isElement($skin)) {
        var attrs = $skin[0].attribs, name;

        for (name in attrs) {
          if (attrs.hasOwnProperty(name)
            && HTML_TO_JS.hasOwnProperty(name)
            && (PROPERTIES[HTML_TO_JS[name]] & HAS_BOOLEAN_VALUE)) {
            attrs[name] = 'true';
          }
        }

        return attrs;
      }
    },

    hasProp: function($skin, name) {
      return false;//PROPERTIES.hasOwnProperty(name);
    },

    getProp: function($skin, name) {
      return Skin.isElement($skin) ? $skin.prop(name) : $skin[0][name];
    },

    isNativeProp: function() {
      return true;
    },

    getChildren: function($skin) { // include texts and comments
      return $skin.contents().toArray().map(function(content) {
        return $(content);
      });
    },

    getParent: function($skin) { // unnecessary, use `getProp`
      return $skin.parent();
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

    setShadow: function($skin, shadow) {
      if (shadow) {
        $skin._shadow = shadow;
      } else {
        delete $skin._shadow;
      }
    },

    query: function($skin, selector) {
      return $($skin).find(selector).eq(0);
    },

    //queryAll: function($skin, selector) {
    //  return $skin.find(selector);
    //},

    mayDispatchEvent: function($skin, type) {
      return false;//('on' + type) in $skin[0];
    },

    getFixedEvent: function(event) {
      throw new Error('Unsupported on Server');
    },

    addEventListener: function($skin, type, listener, useCapture) {
      throw new Error('Unsupported on Server');
    },

    removeEventListener: function($skin, type, listener, useCapture) {
      throw new Error('Unsupported on Server');
    },

    renderAttrs: function($skin, attrs, dirty) {
      var key, value;
      //if (!dirty) { return; }
      for (key in dirty) {
        if (!dirty.hasOwnProperty(key)) { continue; }

        value = attrs[key];

        if (value != null) {
          $skin.attr(key, value);
        } else {
          $skin.removeAttr(key);
        }
      }
    },

    renderProps: function($skin, props, dirty) {
      var key, value;
      //if (!dirty) { return; }
      for (key in dirty) {
        if (!dirty.hasOwnProperty(key)) { continue; }

        value = props[key];

        if (Skin.isElement($skin)) {
          /*if (PROPERTIES[key]) { // MUST_USE_PROPERTY or HAS_BOOLEAN_VALUE
           $skin.prop(key, value);
           } else */if (value == null) { // null or undefined
            $skin.removeAttr(toKebabCase(key));
          } else /*if (Skin.hasProp($skin, key))*/ {
            $skin.attr(toKebabCase(key), value);
          }
        } else {
          $skin[0][key] = value;
        }
      }
    },

    renderStyle: function($skin, style, dirty) {
      //if (!dirty) { return; }
      for (var key in dirty) {
        if (dirty.hasOwnProperty(key)) {
          $skin.css(key, style[key]);
        }
      }
    },

    renderClasses: function($skin, classes, dirty) {
      //if (!dirty) { return; }
      var names = [];

      for (var key in classes) {
        if (classes.hasOwnProperty(key) && classes[key]) {
          names.push(key);
        }
      }

      $skin.attr('class', names.join(' '));
    },

    renderChildren: function renderChildren($skin, children) {
      var i, n, m, $removed, $content, $contents;

      n = children.length;

      if (n) {
        for (i = 0; i < n; ++i) {
          $skin.append(children[i].$skin);
        }
      }

      $contents = $skin.contents();
      m = $contents.length;

      if (n < m) {
        $removed = [];
        for (i = m - n; i >= 0; --i) {
          $content = $contents.eq(i);
          $removed.push($content);
          $content.detach();
        }
      }

      return $removed;
    },

    renderToString: function($skin) {
      return $('<div></div>').append($skin).html();
    }
  });

  //Exact.Skin = Skin;

  global = global || window || {};

  if (module) {
    module.exports = Skin;
  } else {
    global.ExactSkin = Skin;
  }

})(
  typeof global !== 'undefined' ? global : null,
  typeof module !== 'undefined' ? module : null
);
