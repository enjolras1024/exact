//######################################################################################################################
// src/entry.js
//######################################################################################################################
(function(global, module) {
  'use strict';

  var Exact = { version: '0.0.8' };
//
//  global = global || window || {};
//
//  if (module) {
//    module.exports = Exact;
//  } else {
//    global.Exact = Exact;
//  }
//
//  Exact.global = global;
//
//})(typeof global !== 'undefined' ? global : null, typeof module !== 'undefined' ? module : null);

//######################################################################################################################
// src/utils/PathUtil.js
//######################################################################################################################
(function() {

  var PATH_DELIMITER = /\[|\]?\./;

  Exact.PathUtil = {
    parse: function parse(path) {
      return path ? path.split(PATH_DELIMITER) : null;
    }
  };

})();

//######################################################################################################################
// src/utils/StringUtil.js
//######################################################################################################################
(function() {

  var QUOTE_CODE = "'".charCodeAt(0);
  var SLASH_CODE = '\\'.charCodeAt(0);
  //var SPACE_CODE = ' '.charCodeAt(0);
  
  Exact.StringUtil = {
    /**
     * Split a string. If the delimiter appears in '' or brackets, it will be ignored.
     * Each piece of string will be trimmed.
     *
     * @param {string} expression
     * @param {string} delimiter
     * @param {string} brackets
     * @returns {Array}
     */
    split: function split(expression, delimiter, brackets) {
      var i = -1, l = -1, r = -1, n, cc, cb, cl, cr, ct, iq, piece, pieces = [];

      expression = expression.trim();

      if (expression[expression.length - 1] !== delimiter) {
        expression += delimiter;
      }

      n = expression.length;

      if (n === 1) {
        return pieces;
      }

      l = 0;
      delimiter = delimiter.charCodeAt(0);
      brackets = [brackets.charCodeAt(0), brackets.charCodeAt(1)];

      while (++i < n) {

        cc = expression.charCodeAt(i);

        if (cc === QUOTE_CODE && cb !== SLASH_CODE) {
          iq = !iq;
        }

        if (iq) {
          cb = cc;
          continue;
        }

        if (!ct) {
          cl = -1;
          cr = -1;

          if (cc === brackets[0]/* && !iq*/) {
            cl = cc;
            cr = brackets[1];
            ct = 1;
          }
        } else {
          if (cc === cr) {
            --ct;
          } else if (cc === cl) {
            ++ct;
          }
        }

        if (/*!iq && */!ct && cc === delimiter) {
          piece = expression.slice(l, i).trim();
          //if (!piece) {
          //  throw new Error('Illegal argument list'); // TODO: ???
          //}
          pieces.push(piece);
          l = i+1;
        }

        cb = cc;

      }

      return pieces;
    },

    range: function(expr, index, symbol, brackets) {
      var n = expr.length, i, j, ct, cc, cb, iq;

      i = expr.indexOf(symbol + brackets[0], index);

      if (i >= 0 && expr.charCodeAt(i - 1) !== SLASH_CODE) {
        j = i + symbol.length;
        ct = 1;

        brackets = [brackets.charCodeAt(0), brackets.charCodeAt(1)];

        while (++j < n) {
          cc = expr.charCodeAt(j);

          if (cc === QUOTE_CODE && cb !== SLASH_CODE) {
            //cb = cc;
            iq = !iq;
          }

          if (iq) {
            cb = cc;
            continue;
          }

          if (cc === brackets[1] /*&& cb !== SLASH_CODE*/) {
            --ct;
            if (!ct) {
              return [i, j+1];
            }
          } else if (cc === brackets[0]) {
            ++ct;
          }

          cb = cc;
        }
      }

      return null;//[-1, -1];
    }
  };

})();

//######################################################################################################################
// src/utils/LiteralUtil.js
//######################################################################################################################
(function() {

  /**
   * @constant
   */
  var SPECIAL_VALUES = {
    'true': true,
    'false': false,
    'NaN': NaN,
    'null': null,
    'undefined': undefined
  };

  function toSpecial(expr) {
    return SPECIAL_VALUES[expr];
  }

  function toAnyValue(expr) {
    try {
      return JSON.parse(expr);
    } catch (error) {}
  }

  function toBoolean(expr) {
    return !!parse(expr);
  }

  //function toNumber(expr) {
  //  return Number(expr);
  //}

  function toString(expr) {
    return expr;
  }

  //string in single quotes
  function toStrISQ(expr) {
    return expr.slice(1, expr.length - 1);
  }

  function toJSON(expr) {
    return toAnyValue(expr) || null;
  }

  var typedParsers = {
    'boolean': toBoolean,
    'number': Number,
    'string': toString,
    'json': toJSON
  };

  var STRING_IN_SINGLE_QUOTES_REGEXP = /^'.*'$/;

  /**
   * Parse possible value from expression.
   *
   * @param {string} expr
   * @param {string} type
   * @returns {*}
   */
  function parse(expr, type) {
    /*if (typeof expr !== 'string') {
      throw new TypeError('expr must be string');
    }*/

    expr = expr.trim();

    if (!expr) { return; }

    if (type/* && type !== '*'*/) {
      if (!(type in typedParsers)) {
        throw new Error('no such type of literal parser, try on json');
      }
      return typedParsers[type](expr);
    }

    if (expr in SPECIAL_VALUES) {
      return toSpecial(expr);//SPECIAL_VALUES[expr];
    } else if (!isNaN(expr)) {
      return Number(expr);
    } else if (STRING_IN_SINGLE_QUOTES_REGEXP.test(expr)) {
      return toStrISQ(expr);
    } else /*if (JSON_LIKE_REGEXP.test(expr))*/ {
      return toAnyValue(expr);
    }
    //else, return undefined
  }

  Exact.LiteralUtil = {

    parse: parse,

    toNumber: Number,

    toBoolean: toBoolean,

    toAnyValue: toAnyValue
  };

})();

//######################################################################################################################
// src/share/constants.js
//######################################################################################################################
(function() {

  Exact.EVENT_SYMBOL = 'event';
  Exact.EVENT_OPERATOR = '^';
  Exact.CONTEXT_SYMBOL = '$';
  Exact.DATA_BINDING_BRACKETS = '{}';
  Exact.BINDING_OPERATORS = {
    ONE_TIME: '&', ONE_WAY: '@', TWO_WAY: '#', EVENT: '+', TEXT: '?'
  };

})();

//######################################################################################################################
// src/share/functions.js
//######################################################################################################################
(function() {

  var helper = {
    bind: function() {
      var name, method, target = this.target;

      for (var i = 0, n = arguments.length; i < n; ++i) {
        name = arguments[i];
        method = target[name];

        if (typeof method === 'function') {
          target[name] = method.bind(target);
        }
      }
    }
  };

  Exact.help = function help(target) {
    helper.target = target;
    return helper;
  };

  Exact.assign = function assign(target/*,..sources*/) { // Object.assign
    if (target == null) {
      throw  new TypeError('Cannot convert undefined or null to object');
    }

    if (!(target instanceof Object)) {
      var type = typeof target;

      if (type === 'number') {
        target = new Number(target);
      } else if (type === 'string') {
        target = new String(target);
      } else if (type === 'boolean') {
        target = new Boolean(target);
      }
    }

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
  };

  Exact.setImmediate = (function(setImmediate, MutationObserver/*, requestAnimationFrame*/) {
    if (!setImmediate) {

      if (MutationObserver) {
        var cbs = [];
        var flag = 0;
        var text = document.createTextNode('');
        var observer = new MutationObserver(function() {
          var func;

          while (func = cbs.pop()) {
            func();
          }

          flag = flag ? 0 : 1;
        });

        observer.observe(text, {
          characterData: true
        });

        setImmediate = function(func) {
          if (func) {
            cbs.unshift(func);
            text.data = flag;
          }
        }
      } else {
        setImmediate = function(func) {
          setTimeout(func, 0);
        }
      }

    }

    return setImmediate;
  })(
    typeof setImmediate !== 'undefined' ? setImmediate : null,
    typeof MutationObserver !== 'undefined' ? MutationObserver : null,
    typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : null
  );

  function defineProps(target, sources) {
    var i, n, source;
    for (i = 0, n = sources.length; i < n; ++i) {
      source = sources[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        }
      }
    }
  }

  /**
   * Define new class, supporting extends and mixins.
   *
   * @static
   * @method defineClass
   * @param {Object} props
   */
  Exact.defineClass = function defineClass(props) {
    var subClass, superClass, mixins, statics, sources;

    // superClass
    if (props.hasOwnProperty('extend')) {
      superClass = props.extend;

      if (typeof superClass !== 'function') {
        throw new TypeError('superClass must be a function');
      }
    } else {
      superClass = Object;
    }

    // subClass
    if (props.hasOwnProperty('constructor')) {
      subClass = props.constructor;
      //delete props.constructor;
      if (typeof subClass !== 'function') {
        throw new TypeError('subClass must be a function');
      }
    } else {
      subClass = function() {
        superClass.apply(this, arguments);
      };
    }

    // props
    subClass.prototype = Object.create(superClass.prototype);

    sources = [subClass.prototype];

    mixins = props.mixins;
    if (Array.isArray(mixins)) {
      //delete props.mixins;
      sources.push.apply(sources, mixins);
    }

    sources.push(props);

    defineProps(subClass.prototype, sources);

    Object.defineProperty(subClass.prototype, 'constructor', {
      value: subClass, enumerable: false, writable: true, configurable: true
    });

    // static
    sources = [subClass, superClass];

    statics = props.statics;

    if (statics) {
      mixins = statics.mixins;
      if (Array.isArray(mixins)) {
        //delete statics.mixins;
        sources.push.apply(sources, mixins);
      }

      sources.push(statics);
    }

    defineProps(subClass, sources);

    delete subClass.prototype.statics;
    delete subClass.prototype.entend;
    delete subClass.prototype.mixins;
    delete subClass.mixins;

    return subClass;
  };

})();

//######################################################################################################################
// src/share/RES.js
//######################################################################################################################
(function() {

  var PathUtil = Exact.PathUtil;

  /**
   * Find the resource in the scope
   *
   * @param {Array} path
   * @param {Object} scope
   * @returns {*}
   */
  function find(path, scope) {
    var i = -1, n = path.length, value = scope;

    while (++i < n) {
      value = value[path[i]];
      if (value === undefined || value === null) {
        return value;
      }
    }

    return value;
  }

  Exact.RES = {
    /**
     * Find the resource in local, then in RES if necessary.
     *
     * @param {Array|string} path
     * @param {Object} local
     * @param {boolean} stop
     * @returns {*}
     */
    search: function(path, local, stop) {
      if (typeof path === 'string') {
        path = PathUtil.parse(path);
      }

      if (local) {
        var res = find(path, local);
      }

      if (!res && !stop) {
        res = find(path, this);

        //if (!res && Exact.global) {
        //  res = find(path, Exact.global);
        //}
      }

      return res;
    },

    /**
     *
     * @param {string|Array} path
     * @param {*} value
     * @param {boolean} override
     * @returns {boolean}
     */
    register: function(path, value, override) {
      var temp, target = this;

      if (typeof path === 'string') {
        path = PathUtil.parse(path);
      }

      var i = -1, n = path.length - 1;

      while (++i < n) {
        temp = target[path[i]];

        if (temp == null) { // null or undefined
          temp = target[path[i]] = {};
        } else if (!(temp instanceof Object)) {
          throw new TypeError('You can not register resource to ' + typeof temp);
        }

        target = temp;
      }

      var prop = path[i];

      if (!override && target.hasOwnProperty(prop)) {
        if ('development' === 'development') {
          console.warn('the resource on path `' + path.join('.') + '` already exists');
        }
        return false;
      }

      Object.defineProperty(target, prop, {
        value: value, writable: false, enumerable: true, configurable: true
      });

      return true;
    }
  };

})();

//######################################################################################################################
// src/skins/SkinJQuery.js
//######################################################################################################################
(function() {
  // TODO: check jQuery
  var $ = require('cheerio');

  if (typeof $ === 'undefined') {
    throw new Error('cheerio is required');
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

  Exact.defineClass({
    constructor: Skin,

    statics: {
      toCamelCase: toCamelCase,

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

      createElement: function(tag, ns) {
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

        return $('<'+tag+'>').eq(0);
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

        for (var key in dirty) {
          if (dirty.hasOwnProperty(key) && classes[key]) {
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
    }

  });

  Exact.Skin = Skin;

})();

//######################################################################################################################
// src/base/Watcher.js
//######################################################################################################################
(function() {

  var Array$slice= Array.prototype.slice;

  function Watcher() {
    this._actions = null;
  }

  function getFixedEvent(info) {
    var event;

    if (info.type) {
      event = info;
    } else {
      event = {};

      var i = info.indexOf('.');

      if (i > 0) {
        event.type = info.slice(0, i);
        event.keyName = info.slice(i + 1);
      } else {
        event.type = info;
      }
    }

    return event;
  }

  /**
   * Add custom event handler or DOM event listener.
   *
   * @param {Watcher} watcher
   * @param {Object|string} type
   * @param {Function} exec
   * @param {boolean} useCapture
   * @returns {Object}
   */
  function register(watcher, type, exec, useCapture) {
    var actions = watcher._actions, constructor = watcher.constructor;

    if (typeof exec !== 'function') { return null; }

    if (!actions) {
      Object.defineProperty(watcher, '_actions', {
        value: {}, writable: false, enumerable: false, configurable: true
      });
      actions = watcher._actions;
    }

    var event = getFixedEvent(type);

    var action = actions[event.type];

    //  Create action
    if (!action) {
      action = actions[event.type] = { handlers: []/*, listener: null*/ };
    }

    var handlers = action.handlers, keyName = event.keyName;

    var handler, i, n = handlers.length;
    // Check if exec exists in handlers.
    for (i = 0; i < n; ++i) {
      handler = handlers[i];
      if (exec === handler.exec && keyName === handler.keyName) {
        return action;
      }
    }

    handler = {exec: exec};

    if (keyName) {
      handler.keyName = keyName;
    }

    if (useCapture) {
      handler.useCapture = useCapture;
    }

    //handlers.unshift(handler);
    handlers.push(handler);

    //May add DOM event listener.
    if (!('listener' in action)){
      if (typeof constructor.addEventListener === 'function') {
        constructor.addEventListener(watcher, action, event.type);
      } else {
        handler.listener = null;
      }
    }

    return action;
  }

  /**
   * Remove custom event handler or DOM event listener.
   *
   * @param {Watcher} watcher
   * @param {Object|string} type
   * @param {Function|string} exec
   * @param {boolean} useCapture
   * @returns {Object}
   */
  function remove(watcher, type, exec, useCapture) {
    var actions = watcher._actions, constructor = watcher.constructor, all = arguments.length === 2;

    if (!actions) { return; }

    var event = getFixedEvent(type);

    var action = actions[event.type];

    if (!action) { return; }

    var handlers = action.handlers, keyName = event.keyName;

    //if (!handlers) { return; }

    var handler, i, n = handlers.length;

    if (all && !keyName) {
      handlers.splice(0);
    } else {
      //for (i = n-1; i >= 0; --i) {
      for (i = 0; i < n; ++i) {
        handler = handlers[i];
        if ((all || exec === handler.exec) && (!keyName || keyName === handler.keyName)) {
          handlers.splice(i--, 1);
          break;
        }
      }
    }

    if (handlers.length === 0) {
      if (action.listener && typeof constructor.removeEventListener === 'function') {
        constructor.removeEventListener(watcher, action, event.type);
      }

      delete actions[event.type];
    }

    return action;
  }

  function clean(watcher) {
    var actions = watcher._actions, type;

    if (!actions) { return; }

    for (type in actions) {
      if (actions.hasOwnProperty(type)) {
        remove(watcher, type);
      }
    }
  }

  /**
   *
   * @param {Watcher} watcher
   * @param {Array} params
   * @param {Event|string} event
   * @param {boolean} keep
   */
  function dispatch(watcher, params, event, keep) {
    var actions = watcher._actions, action;

    if (!actions) { return; }

    event = getFixedEvent(event);

    action = actions[event.type];

    if (action) {
      event.dispatcher = watcher;

      if (keep) {
        params.unshift(event); //[event].concat(params);
      }

      var i, n, exec, handler, handlers = action.handlers;

      n = handlers.length;
      // trigger handlers
      for (i = 0; i < n; ++i) {
      //for (i = n-1; i >= 0; --i) {
        handler = handlers[i];

        if (!handler || (handler.keyName && handler.keyName !== event.keyName)) { continue; }
        //if ((event.eventPhase === 1) === !!handler.useCapture) {
          exec = handler.exec;
          exec.apply(null, params);
        //}
      }
    }
  }

  Exact.defineClass({
    /**
     * A watcher can add and remove event handlers, emit or send event with or without extra parameters.
     *
     * @constructor
     */
    constructor: Watcher,

    /**
     * Use Watcher to add DOM event or custom event handler.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @param {boolean} useCapture
     * @returns {self}
     */
    on: function on(type, exec, useCapture) {
      var opts, value;

      if (typeof type === 'object') {
        opts = type;

        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }

          value = opts[type];

          if (Array.isArray(value)){  // e.g. on({click: [function(){...}}, true]); useCapture as 2nd argument
            register(this, type, value[0], value[1]);
          } else {                    // e.g. on({click: function(){...}});
            register(this, type, value);
          }
        }
      } else if (type) {              // e.g. on('click', context.onClick);
        register(this, type, exec, useCapture);
      }

      return this;
    },


    /**
     * Use Watcher to remove DOM event or custom event handler.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @param {boolean} useCapture
     * @returns {self}
     */
    off: function off(type, exec, useCapture) {
      var n = arguments.length, t = typeof type, opts, value;

      if (n === 0) {      // e.g. off()
        clean(this);
      } else if (t === 'string') {
        if (n === 1) {    // e.g. off('click');
          remove(this, type);
        } else {          // e.g. off('click', context.onClick);
          remove(this, type, exec, useCapture);
        }
      } else if (t === 'object') {
        opts = type;
        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }
          value = opts[type];
          if (Array.isArray(value)) {   // e.g. off({click: [context.onClick, true]});
            remove(this, type, value[0], value[1]);
          } else {                      // e.g. off({click: context.onClick});
            remove(this, type, value);
          }
        }
      }

      return this;
    },

    /**
     * It works like `on`. But the handler will be removed once it executes for the first time.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @param {boolean} useCapture
     * @returns {self}
     */
    once: function(type, exec, useCapture) {
      var self = this;

      function func() {
        self.off(type, func, useCapture);
        exec.apply(null, arguments);
      }

      this.on(type, func, useCapture);

      return this;
    },

    /**
     * Dispatch custom event, handlers accept rest arguments.
     *
     * @example #emit('ok', a, b) may trigger function(a, b){}
     * @param {Event|Object|string} type
     * @returns {self}
     */
    emit: function emit(type/*, ...rest*/) {
      var params = Array$slice.call(arguments, 1);
      dispatch(this, params, type, false);
      return this;
    },

    /**
     * Dispatch custom event with extras.
     *
     * @example #send('ok', a, b) may trigger function(event, a, b){}
     * @param {Event|Object|string} type
     * @returns {self}
     */
    send: function send(type/*, ...rest*/) {
      var params = Array$slice.call(arguments, 1);
      dispatch(this, params, type, true);
      return this;
    }

  });

  Exact.Watcher = Watcher;

})();

//######################################################################################################################
// src/base/Accessor.js
//######################################################################################################################
(function() {

  var descriptorShared = {
    enumerable: true,
    configurable: true
  };

  var getters = {}, setters = {};

  function makeGetter(key) {
    if (!getters.hasOwnProperty(key)) {
      getters[key] = function() {
        return this.get(key);
      };
    }

    return getters[key];
  }

  function makeSetter(key) {
    if (!setters.hasOwnProperty(key)) {
      setters[key] = function(val) {
        this.set(key, val);
      };
    }

    return setters[key];
  }

  function Accessor() {
    throw new Error('Accessor is abstract class and can not be instantiated');
  }

  Exact.defineClass({
    constructor: Accessor,

    statics: {
      define: function define(prototype, key) {
        descriptorShared.get = makeGetter(key);
        descriptorShared.set = makeSetter(key);
        Object.defineProperty(prototype, key, descriptorShared);
      }
    },

    get: function get(key) {
      throw new Error('this method must be implemented by sub-class');
    },

    set: function set(key, value) {
      throw new Error('this method must be implemented by sub-class');
    },

    save: function save(props) {
      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          this.set(key, props[key]);
        }
      }
      //return this;
    },

    unset: function unset(key) {
      this.set(key, undefined);
      delete this[key];
    }
  });

  Exact.Accessor = Accessor;

})();

//######################################################################################################################
// src/base/Schedule.js
//######################################################################################################################
(function() {

  var setImmediate = Exact.setImmediate;

  var pool = [], queue = [], cursor = 0, waiting = false, running = false;

  function run() {

    cursor = 0;
    running = true;

    var target; //TODO: func, args

    while (cursor < pool.length) {
      target = pool[cursor];

      target.update();

      ++cursor;
    }

    for (var i = 0, n = queue.length; i < n; ++i) {
      target = queue[i];

      target.render();
    }

    waiting = false;
    running = false;
    queue.splice(0); //queue.length = 0;
    pool.splice(0); //pool.length = 0;
    cursor = 0;
  }

  Exact.Schedule = {
    /**
     * target to be inserted must have `guid` and method `update`
     * @param {Object} target
     */
    insert: function(target) {
      //if (!target || !target.update) { return; }
      var i, n = pool.length, id = target.guid;

      if (!running) {
        i = n - 1;
        while (i >= 0 && id < pool[i].guid) {
          --i;
        }
        ++i;
      } else {
        i = cursor;
        while (i < n && id >= pool[i].guid) {
          ++i;
        }
      }

      pool.splice(i, 0, target);

      if (!waiting) {
        waiting = true;
        setImmediate(run);
      }
    },

    /**
     * target to be appended must have method `render`
     * @param {Object} target
     */
    append: function(target) {
      //if (!target || !target.render) { return; }
      queue.push(target);
    }
  };

})();

//######################################################################################################################
// src/base/Validator.js
//######################################################################################################################
(function() {

  function getType(value) {
    if (value instanceof Object) {
      var constructor = value.constructor;
      return  constructor.fullName || constructor.name;
    }

    return typeof value;
  }

  function makeTypeError(constructorName, propertyName, expectedType, actualType) {
    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be `' + expectedType + (actualType ? '`, not `' + actualType : '') + '`');
  }

  function makeTypesError(constructorName, propertyName, expectedTypes, actualType) {
    var types = [];
    for (var i = 0, n = expectedTypes.length; i < n; ++i) {
      types.push('`' + (expectedTypes[i].name || expectedTypes[i]) + '`');
    }

    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be ' + types.join(' or ') + (actualType ? ', not `' + actualType : '') + '`');
  }

  /**
   * Validate the type of the value when the key is set in target.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {string|Function} type
   * @returns {TypeError}
   */
  function validateType(target, key, value, type) {
    var t = typeof type, error, constructor;

    if (t === 'string' && typeof value !== type) { //TODO: type can be array
      t = type;
      error = true;
    } else if (t === 'function' && !(value instanceof type)) {
      t = type.fullName || type.name;
      error = true;
    }

    if (error) {
      constructor = target.constructor;
      return makeTypeError(constructor.fullName || constructor.name, key, t, getType(value));
    } else if (Array.isArray(type)) {
      for (var i = 0, n = type.length; i < n; ++i) {
        t = typeof type[i];
        if ((t === 'string' && typeof value === type[i]) || (t === 'function' && value instanceof type[i])) {
          break;
        }
      }

      if (i === n) {
        constructor = target.constructor;
        return makeTypesError(constructor.fullName || constructor.name, key, type, getType(value));
      }
    }
  }

  /**
   * Validate if the value matches the pattern.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {RegExp} pattern
   * @returns {Error}
   */
  function validatePattern(target, key, value, pattern) {
    if (!pattern.test(value)) {
      return new Error(value + ' does not match the pattern ' + pattern.toString() +
        ' of the property `' + key + '` in ' +  target.toString());
    }
  }

  /**
   * Validator provides the `validate()` method.
   *
   * @example A constructor has descriptors:
   *
   *  {
   *    name: 'string',
   *    list: Array,
   *    date: {
   *      type: [Date, 'number', 'string]
   *    },
   *    phone: {
   *      validator: /\d{13}/
   *    },
   *    price: {
   *      type: 'number',
   *      validator: function() {...} // returns error or not
   *    }
   *  }
   *
   *
   * @static
   * @constructor
   */
  Exact.Validator = {
    /**
     * Validate the value when the key is set in target.
     *
     * @param {Object} target
     * @param {string} key
     * @param {*} value
     * @param {Object} desc   - descriptor
     * @returns {boolean}
     */
    validate: function validate(target, key, value, desc) {
      if (!desc.type && !desc.validator) { return true; }

      var error, validator, type, validated;

      type = desc.type;
      //required = desc.required;
      validator = desc.validator;

      if (/*!error && */type) {
        validated = true;
        error = validateType(target, key, value, type);
      }

      if (!error && validator) {
        validated = true;
        if (typeof validator === 'function') {
          error = validator.call(target, value, key);
        } else {
          error = validatePattern(target, key, value, validator);
        }
      }

      if (validated && target.on && target.send) {
        target.send('validated.' + key, error);
      }

      if (error) {
        if ('development' === 'development') {
          console.warn('Invalid:', error.message);
        }
        return false;
      }

      return true;
    }
  };

})();

//######################################################################################################################
// src/base/Evaluator.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;

  var emptyArray = [];

  var ARGUMENT_FLAGS = {
    EVALUATOR: -1,
    INVARIABLE: 0,
    LOCAL_PATH: 1
  };

  function genArgs(args, locals) {
    var i, n, l, path, origin, flag, flags = args.flags, results = args.slice(0);

    if (flags && flags.length) {
      for (i = 0, n = flags.length; i < n; ++i) {
        flag = flags[i];

        if (flag === ARGUMENT_FLAGS.LOCAL_PATH) {
          path = args[i];
          l = path.length;
          origin = locals[path.origin];
          results[i] = l === 1 ? origin[path[0]] : (l ? RES.search(path, origin, true) : origin);
        } else if (flag === ARGUMENT_FLAGS.EVALUATOR) {
          results[i] = activate(args[i], 'exec', locals);
        }
      }
    }

    return results;
  }

  /**
   *
   * @param {Evaluator} evaluator
   * @param {string} name - 'exec' or 'back'
   * @param {Array} locals
   * @param {*} value
   * @returns {*}
   */
  function activate(evaluator, name, locals, value) {
    var ctx = null, exec, args;

    exec = evaluator[name];

    if (!exec) {
      var path = evaluator.path;
      var n = path.length - 1;

      if (!n) {
        ctx = locals[path.origin];
      }  else {
        ctx = RES.search(path.slice(0, n), locals[path.origin], true);
      }

      exec = ctx[path[n]];
    }

    args = genArgs(evaluator.args || emptyArray, locals);

    if (arguments.length > 3) {
      args.unshift(value);
    }

    return exec.apply(ctx, args);
  }

  function Evaluator(exec, args, back) {
    this.exec = exec;
    this.back = back;
    this.args = args;
  }

  Evaluator.ARGUMENT_FLAGS = ARGUMENT_FLAGS;

  Evaluator.activate = activate;

  Evaluator.create = function create(exec, args, back) {
    return new Evaluator(exec, args, back);
  };

  Exact.Evaluator = Evaluator;
  
})();

//######################################################################################################################
// src/base/Expression.js
//######################################################################################################################
(function() {

  function Expression(compiler, template) {
    this.compiler = compiler; // builder
    this.template = template;
  }

  Expression.create = function create(compiler, template) {
    return new Expression(compiler, template);
  };

  Expression.activate = function activate(expression, property, target, context, locals) {
    var compiler = expression.compiler, template = expression.template;
    if (compiler && compiler.compile) {
      compiler.compile(template, property, target, context, locals);
    }
  };

  Exact.Expression = Expression;

})();

//######################################################################################################################
// src/base/DirtyMarker.js
//######################################################################################################################
(function() {

  function DirtyMarker() {
    throw new Error('DirtyMarker is static class and can not be instantiated');
  }

  Exact.defineClass({

    constructor: DirtyMarker,

    statics: {
      /**
       * Check and mark the changed prop dirty
       *
       * @param {Object} object
       * @param {string} key
       * @param {*} val
       * @param {*} old
       * @returns {boolean}
       */
      check: function check(object, key, val, old) {
        var _dirty = object._dirty;

        if (!_dirty) {
          _dirty = {};

          Object.defineProperty(object, '_dirty', {
              value: _dirty, enumerable: false, writable: true, configurable: true}
          );
        }

        if (!(key in _dirty)) {
          _dirty[key] = old;
        } else if (_dirty[key] === val) { //TODO: _dirty[key] = true is enough
          delete _dirty[key];
        }
      },

      /**
       * Clean all or make dirty prop clean
       *
       * @param {Object} object
       * @param {string} key
       */
      clean: function clean(object, key) {
        if (!key) {
          object._dirty = null;
        } else {
          delete object._dirty[key];
        }
      }
    },

    /**
     * Find if some prop is dirty.
     *
     * @param {string} key
     * @returns {boolean}
     */
    hasDirty: function hasDirty(key) {
      var _dirty = this._dirty;
      return _dirty ? (key == null || _dirty.hasOwnProperty(key)) : false;
    }
  });

  Exact.DirtyMarker = DirtyMarker;

})();

//######################################################################################################################
// src/core/models/Collection.js
//######################################################################################################################
(function() {

  var Watcher = Exact.Watcher;

  function Collection() {//TODO: changed.length
    var l = arguments.length, n = arguments[0];

    if (l) {
      if (l === 1 && typeof n === 'number') {
        this.push.apply(this, new Array(n));
      } else {
        this.push.apply(this, arguments);
      }
    }
  }

  var base = Array.prototype;

  function invalidate(collection, key) {
    collection.isInvalidated = true;
    collection.send(key ? 'changed.' + key : 'changed'); //collection.send(key ? 'change.' + key : 'change);

    //if (collection.onChange) { // TODO: remove
    //  collection.onChange();
    //}
  }

  Exact.defineClass({
    constructor: Collection,  extend: Array,

    mixins: [Watcher.prototype],

    statics: {
      from: function(contents) {
        var collection = new Collection();

        collection.push.apply(collection, contents);

        return collection;
      },

      clean: function(collection) {
        collection.isInvalidated = false;
      }
    },

    //type: Object,

//    clean: function() {
//      this.isInvalidated = false;
//    },

    push: function() {
      if (arguments.length) {
        base.push.apply(this, arguments);
        invalidate(this, 'length');
      }

      return this.length;
    },

    pop: function() {
      if (this.length) {
        var popped = base.pop.call(this);
        invalidate(this, 'length');
      }

      return popped;
    },

    unshift: function() {
      if (arguments.length) {
        base.unshift.apply(this, arguments);
        invalidate(this, 'length');
      }

      return this.length;
    },

    shift: function() {
      if (this.length) {
        var shifted = base.shift.call(this);
        invalidate(this, 'length');
      }

      return shifted;
    },

    splice: function() {
      var n = this.length;
      var spliced = base.splice.apply(this, arguments);

      invalidate(this, this.length !== n ? 'length' : '');

      return spliced;
    },

    sort: function(comparator) {
      base.sort.call(this, comparator);

      invalidate(this);

      return this;
    },

    reverse: function() {
      base.reverse.call(this);

      invalidate(this);

      return this;
    },

    //TODO: filter, sort, map, ...

    set: function(index, item) {
      if (index >= this.length) {
        for (var i = this.length; i < index; ++i) {
          base.push.call(this, undefined);
        }

        base.push.call(this, item);
      } else {
        if (this[index] === item) { return this; }
        this[index] = item;
        //base.splice.call(this, index, 1, item);
      }

      invalidate(this);

      //return this;
    },

    reset: function(items) {
      var i, n, m, flag;
      n = this.length;
      m = items.length;


      if (n > m) {
        base.splice.call(this, m);
        flag = true;
      }

      for (i = 0;  i < m; ++i) {
        if (!flag && this[i] !== items[i]) {
          flag = true;
        }

        this[i] = items[i];
      }

      this.length = m;

      if (flag) {
        invalidate(this, m != n ? 'length' : '');
      }

      //return this;
    },

    insert: function(item, before) { //TODO: add type checker, Children
      //if (!(item instanceof this.type) || (arguments.length > 1 && !(before instanceof this.type))) {
      ////if (!(item instanceof Object) || (arguments.length > 1 && !(before instanceof Object))) {
      //  throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      //}

      var i, n;

      n = this.length;

      if (before && before === item) { return this; }

      for (i = 0; i < n; ++i) {
        if (this[i] === item) {
          base.splice.call(this, i, 1);
          n = this.length;// <=> --n;
          break;
        }
      }

      if (before != null) {
        for (i = 0; i < n; ++i) {
          if (this[i] === before) {
            break;
          }
        }

        if (i === n) { //TODO: silent
          throw new Error('The item before which the new item is to be inserted is not existed in this collection');
        }

        base.splice.call(this, i, 0, item);
      } else {
        base.push.call(this, item);
      }

      invalidate(this, 'length');

      //return this;
    },

    remove: function(item) { //TODO: can be number index
      //if (!(item instanceof this.type)) {
      ////if (!(item instanceof Object)) {
      //  throw new TypeError("Failed to execute `remove` on `Collection`: the item to be removed must be object.");
      //}

      var i, n;

      for (i = 0, n = this.length; i < n; ++i) {
        if (this[i] === item) {
          break;
        }
      }

      if (i === n) { //TODO: silent
        throw new Error('The item is to be removed is not existed in this collection');
      }

      if (i < n -1) {
        base.splice.call(this, i, 1);
      } else {
        base.pop.call(this);
      }

      invalidate(this, 'length');

      //return this;
    },

    replace: function(item, existed) {
      //if (!(item instanceof this.type) || !(existed instanceof this.type)) {
      ////if (!(item instanceof Object) || !(existed instanceof Object)) {
      //  throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      //}

      if (item === existed) { return /*this*/; }

      var i, n;

      for (i = 0, n = this.length; i < n; ++i) {
        if (this[i] === existed) {
          break;
        }
      }

      if (i === n) { //TODO: silent
        throw new Error('The item to be replaced is not existed in this collection');
      }

      this.set(i, item);

      invalidate(this);

      //return this;
    }
  });

  Exact.Collection = Collection;

})();

//######################################################################################################################
// src/core/models/Container.js
//######################################################################################################################
(function() {

  var Accessor = Exact.Accessor;
  var DirtyMarker = Exact.DirtyMarker;

  function Container(props, onChange) { // internal class
    this.onChange = onChange;

    if (props) {
      this.save(props);
    }
  }

  Exact.defineClass({

    constructor: Container,

    mixins: [Accessor.prototype, DirtyMarker.prototype],

    statics: {
      create: function create(props, onChange) {
        return new Container(props, onChange);
      }
    },

    set: function set(key, val) {
      var old = this[key];

      if (val !== old) {
        this[key] = val;

        DirtyMarker.check(this, key, val, old);

        if (this.onChange) {
          this.onChange();
        }
      }
    }
  });

  Exact.Container = Container;

})();

//######################################################################################################################
// src/core/models/Store.js
//######################################################################################################################
(function() {

  var Watcher = Exact.Watcher;
  var Accessor = Exact.Accessor;

  function Store(props) {
    Store.initialize(this, props);
  }

  Exact.defineClass({
    constructor: Store,

    mixins: [Accessor.prototype, Watcher.prototype],

    statics: {
      create: function create(props) {
        return new Store(props);
      },

      initialize: function initialize(store, props) {
        if (!store._props) {
          Object.defineProperty(store, '_props', {value: {}/*, configurable: true*/});
        }

        store.save(props);
      }
    },

    get: function(key) {
      return this._props[key];
    },

    set: function set(key, val) {
      var props = this._props;

      if (!props.hasOwnProperty(key)) {
        Accessor.define(this, key);
        props[key] = null;
      }

      var old = props[key];

      if (val !== old) {
        props[key] = val;

        if ('>=ES5' === '<ES5') {
          this[key] = val;
        }

        this.send('changed.' + key, val, old);
      }
    }
  });

  Exact.Store = Store;

})();

//######################################################################################################################
// src/core/shadows/Shadow.js
//######################################################################################################################
(function() {

  var Skin = Exact.Skin;

  var Container = Exact.Container;
  var Collection = Exact.Collection;

  var Watcher = Exact.Watcher;
  var Accessor = Exact.Accessor;
  var Schedule = Exact.Schedule;
  var DirtyMarker = Exact.DirtyMarker;

  var setImmediate = Exact.setImmediate;

  var guid = 0;//Number.MIN_VALUE;

  function createContainer(shadow) {
    return Container.create(null, shadow.invalidate);
  }

  function createCollection(shadow) {
    var collection = new Collection();

    collection.on('changed', shadow.invalidate);

    return collection;
  }

  /**
   * attrs getter
   *
   * @returns {Container}
   */
  function getAttrs() {
    if (!this._attrs/* && this.tag*/) {
      Object.defineProperty(this, '_attrs', {value: createContainer(this), configurable: true});
    }
    return this._attrs;
  }

  /**
   * props getter
   *
   * @returns {Container}
   */
  function getProps() {
    //if (!this._props/* && this.tag*/) {
    //  Object.defineProperty(this, '_props', {value: createContainer(this), configurable: true});
    //}
    return this._props;
  }

  /**
   * style getter
   *
   * @returns {Container}
   */
  function getStyle() {
    if (!this._style/* && this.tag*/) {
      Object.defineProperty(this, '_style', {value: createContainer(this), configurable: true});
    }
    return this._style;
  }

  /**
   * classes getter
   *
   * @returns {Container}
   */
  function getClasses() { // TODO: class ClassList extends Container { append, remove }
    if (!this._classes/* && this.tag*/) {
      Object.defineProperty(this, '_classes', {value: createContainer(this), configurable: true});
    }
    return this._classes;
  }

  /**
   * children getter
   *
   * @returns {Collection}
   */
  function getChildren() {
    if (!this._children /*&& this.tag*/) {
      Object.defineProperty(this, '_children', {value: createCollection(this), configurable: true});
    }
    return this._children;
  }

  ///**
  // * contents getter
  // *
  // * @returns {Collection}
  // */
  //function getContents() {
  //  if (!this._contents && Skin.isElement(this.$skin)) {
  //    Object.defineProperty(this, '_contents', {value: createCollection(this), configurable: true});
  //  }
  //  return this._contents;
  //}

  // lazy mode when getter is supported
  var defineMembersOf = function(shadow) {
    Object.defineProperty(shadow, '_props', {
      value: {}, writable: false, enumerable: false, configurable: false
    });
    Object.defineProperty(shadow, 'props', {get: getProps});

    if (shadow.tag) {
      Object.defineProperty(shadow, 'attrs', {get: getAttrs});
      Object.defineProperty(shadow, 'style', {get: getStyle});
      Object.defineProperty(shadow, 'classes', {get: getClasses});
      Object.defineProperty(shadow, 'children', {get: getChildren});
      //ObjectUtil.defineProperty(shadow, 'contents', {get: getContents});  //TODO: set('contents', []) is ok
    }
  };

  if ('>=ES5' === '<ES5') {
    // immediate mode when getter is not supported
    defineMembersOf = function(shadow) {
      Object.defineProperty(shadow, '_props', {
        value: {}, writable: false, enumerable: false, configurable: false
      });
      shadow.props = shadow._props;

      if (shadow.tag) {
        Object.defineProperty(shadow, 'attrs', {value: createContainer(shadow)});
        Object.defineProperty(shadow, 'style', {value: createContainer(shadow)});
        Object.defineProperty(shadow, 'classes', {value: createContainer(shadow)});
        Object.defineProperty(shadow, 'children', {value: createCollection(shadow)});
        //ObjectUtil_defineProp(shadow, 'contents', {value: createCollection(shadow)});

        shadow._attrs = shadow.attrs;
        shadow._style = shadow.style;
        shadow._classes = shadow.classes;
        shadow._children = shadow.children;
        shadow._contents = shadow.contents;
      }
    }
  }

  function initSkin(shadow, $skin) {
    var ns = shadow.ns, tag = shadow.tag, _shadow;

    if (!$skin || tag !== Skin.getTagName($skin) || ns !== Skin.getNameSpace($skin)
      || ((_shadow = $skin ? Skin.getShadow($skin) : null) && _shadow !== shadow)) {
      $skin = tag ? Skin.createElement(tag, ns) : Skin.createText('');
    }

    shadow.attach($skin);

    return $skin;
  }

  function Shadow() {
    throw new Error('Shadow is abstract and can not be instantiated');
  }

  Exact.defineClass({
    constructor: Shadow,

    mixins: [Watcher.prototype, Accessor.prototype, DirtyMarker.prototype],

    /**
     * invalidate this shadow and insert it to the schedule
     */
    invalidate: function invalidate(key, val, old) {
      if (!this.isInvalidated) {
        //console.log('invalidate', this.toString());
        this.isInvalidated = true;
        Schedule.insert(this);
      }
    },

    /**
     * Update this shadow and append it to the schedule
     */
    update: function update() { //TODO: enumerable = false
      if (!this.isInvalidated) { return; }
      //console.log('update', this.toString());
      if (this.refresh) {
        this.refresh();
      }

      //this.send('updated');

      var $skin = this.$skin;

      if ($skin) {
        var child, children = this._children, $children;
        // TODO: child._depth = this._depth + 1;
        if (children && children.isInvalidated) {
          for (var i = 0, n = children.length; i < n; ++i) {
            child = children[i];
            if (!child.$skin) {
              $children = $children || Skin.getChildren($skin);
              initSkin(child, $children[i]);
            }
          }
        }
      } else {
        initSkin(this);
      }

      Schedule.append(this); //this.render(); TODO: immediate rendering is ok

      this.isInvalidated = false;

      this.send('updated');
    },

    /**
     * Render the dirty parts of this shadow to $skin
     */
    render: function render() {
      var $skin = this.$skin;

      if (!$skin) { return; }

      var dirty = this._dirty,
        props = this._props,
        attrs = this._attrs,
        style = this._style,
        classes = this._classes,
        children = this._children;

      if (dirty) {
        Skin.renderProps($skin, props, dirty);
        DirtyMarker.clean(this);
      }

      if (this.tag) {
        if (attrs && attrs._dirty) {
          Skin.renderAttrs($skin, attrs, attrs._dirty);
          DirtyMarker.clean(attrs);
        }

        if (style && style._dirty) {
          Skin.renderStyle($skin, style, style._dirty);
          DirtyMarker.clean(style);
        }

        if (classes && classes._dirty) {
          Skin.renderClasses($skin, classes, classes._dirty);
          DirtyMarker.clean(classes);
        }

        if (children && (children.isInvalidated)) {
          if ('development' === 'development') {
            if (props.hasOwnProperty('innerHTML') && children.length) {
              console.error("You'd better not use innerHTML and children together.");
            }
          }

          var $removed = Skin.renderChildren($skin, children);

          if ($removed && $removed.length) {
            for (var i = 0, n = $removed.length; i < n; ++i) {
              var $parent = Skin.getParent($removed[i]);
              var shadow = Skin.getShadow($removed[i]);
              if (!$parent && shadow) { // TODO: && !shadow._secrets.reuse
                shadow.detach();
                Shadow.destroy(shadow);
              }
            }
          }

          Collection.clean(children);
        }
      }

      //this.send('rendered');//TODO: beforeRefresh, refreshing
    },

    /**
     *
     * @param {HTMLElement} $skin
     */
    attach: function attach($skin) {
      var shadow = Skin.getShadow($skin);

      // check
      if (shadow) {
        if (shadow === this) {
          return;
        } else {
          throw new Error('a shadow can not attach a $skin that has been attached');
        }
      }

      if (this.tag !== Skin.getTagName($skin)) {
        throw new Error('a shadow can not attach a $skin that has a different tag');
      }

      if (this.ns !== Skin.getNameSpace($skin)) {
        throw new Error('a shadow can not attach a $skin that has a different namespace');
      }

      // define
      Object.defineProperty(this, '$skin', {
        value: $skin,
        writable: true,
        enumerable: false,
        configurable: true
      });

      Skin.setShadow($skin, this);

      // finish
      var type, action, actions = this._actions;

      if (actions) {
        for (type in actions) {
          if (!actions.hasOwnProperty(type)) { continue; }

          action = actions[type];

          if (action) {
            Shadow.addEventListener(this, action, type);
          }
        }
      }

      this.invalidate();
      //this.send('attached');
      //return this;
    },

    /**
     *
     */
    detach: function detach() {
      var type, action, actions = this._actions, $skin = this.$skin;

      if (actions) {
        for (type in actions) {
          if (!actions.hasOwnProperty(type)) { continue; }

          action = actions[type];

          if (action) {
            Shadow.removeEventListener(this, action, type);
          }
        }
      }

      Skin.setShadow($skin, null);

      this.$skin = null;
      //this.send('detached');
      //return this;
    },

    toString: function toString() {
      var constructor = this.constructor;
      return (constructor.fullName || constructor.name) + '<' + this.tag + '>(' + this.guid + ')';
    },

    blur: function blur() { //TODO: remove
      var $skin = this.$skin;

      $skin && setImmediate(function() {
        Skin.call($skin, 'blur');
      });
      //return this;
    },

    focus: function focus() { //TODO: remove
      var $skin = this.$skin;

      $skin && setImmediate(function() {
        Skin.call($skin, 'focus');
      });
      //return this;
    },

    get: function(key) {
      return this._props[key];
    },
    
    set: function set(key, val) {
      var props = this._props;
    
      var old = props[key];
    
      if (val !== old) {
        props[key] = val;
    
        if ('>=ES5' === '<ES5') {
          this[key] = val;
        }
    
        DirtyMarker.check(this, key, val, old);

        this.invalidate();
      }
    },

    statics: {
      /**
       * @param {Shadow} shadow
       * @param {string} tag
       * @param {string} ns
       */
      initialize: function initialize(shadow, tag, ns) {
        shadow.invalidate = shadow.invalidate.bind(shadow);

        Object.defineProperty(shadow, 'guid', {
          value: ++guid, writable: false, enumerable: false, configurable: false
        });

        Object.defineProperty(shadow, 'tag', {
          value: tag, writable: false, enumerable: false, configurable: false
        });

        Object.defineProperty(shadow, 'ns', {
          value: ns, writable: false, enumerable: false, configurable: false
        });

        defineMembersOf(shadow);
      },

      /**
       * @param {Shadow} shadow
       */
      destroy: function destroy(shadow) {
        shadow.off();

        DirtyMarker.clean(shadow);

        var i, children = shadow._children;
        if (children) {
          for (i = children.length - 1; i >= 0; --i) {
            Shadow.destroy(children[i]);
          }
        }

        var binding, bindings = shadow._bindings; //
        if (bindings) {
          for (i = bindings.length - 1; i >= 0; --i) {
            binding = bindings[i];
            binding.constructor.clean(binding);
          }
        }

        if (shadow.release) {
          shadow.release();
        }
      },

      addEventListener: function(shadow, action, type) {
        var $skin = shadow.$skin;

        if (!$skin) { return; }

        if (Skin.mayDispatchEvent($skin, type)) { // TODO: No problem?
          action.listener = function (event) {
            shadow.send(Skin.getFixedEvent(event)); // TODO: Shadow.getShadow(domEvent.currentTarget).send(Skin.getFixedEvent(domEvent))
          };

          Skin.addEventListener($skin, type, action.listener, action.useCapture);
        } else {
          action.listener = null;
        }
      },

      removeEventListener: function(shadow, action, type) {
        var $skin = shadow.$skin;

        if (!$skin) { return; }

        if (action.listener && Skin.mayDispatchEvent($skin, type)) {
          Skin.removeEventListener($skin, type, action.listener, action.useCapture);

          delete action.listener;
        }
      }
    }
  });

  Exact.Shadow = Shadow;
  
})();

//######################################################################################################################
// src/core/shadows/Text.js
//######################################################################################################################
(function() {

  var Shadow = Exact.Shadow;

  function Text(data) {
    Text.initialize(this, data);
  }

  Exact.defineClass({
    constructor: Text, extend: Shadow,

    statics: {

      create: function(data) {
        return new Text(data);
      },

      initialize: function(text, data) {
        if ('development' === 'development') {
          if (text.constructor !== Text) {
            throw new TypeError('Text is final class and can not be extended');
          }
        }

        Shadow.initialize(text, '', '');

        text.set('data', data || '');
      }
    },

    toString: function() {
      return '"' + (this.data.length < 24 ? this.data : (this.data.slice(0, 21) + '...'))  + '"(' + this.guid +')';
    }

  });

  Exact.Text = Text;

})();

//######################################################################################################################
// src/core/shadows/Element.js
//######################################################################################################################
(function () {

  var Shadow = Exact.Shadow;
  var Watcher = Exact.Watcher;

  function Element(props, tag, ns) {
    Element.initialize(this, props, tag, ns);
  }

  Exact.defineClass({
    constructor: Element, extend: Shadow,

    mixins: [Watcher.prototype],

    statics: {
      initialize: function initialize(element, props, tag, ns) {
        if ('development' === 'development') {
          if (element.constructor !== Element) {
            throw new TypeError('Element is final class and can not be extended');
          }
        }

        Shadow.initialize(element, tag, ns || '');

        element.save(props);
      },

      /**
       * Create a element shadow
       *
       * @param {string} tag
       * @param {string} ns
       * @param {Object} props
       * @returns {Element}
       */
      create: function create(tag, ns, props) {
        //if (ns && typeof ns === 'object') { // create(tag, props)
        //  props = ns;
        //} // else create(tag) or create(tag, ns) or create(tag, ns, props)

        return new Element(props, tag, ns);
      }
    }
  });

  Exact.Element = Element;

})();

//######################################################################################################################
// src/core/shadows/Component.js
//######################################################################################################################
(function () {

  var assign = Exact.assign;
  var Shadow = Exact.Shadow;

  var Watcher = Exact.Watcher;
  var Accessor = Exact.Accessor;
  var Validator = Exact.Validator;
  var DirtyMarker = Exact.DirtyMarker;

  //var base = Shadow.prototype;
  
  var emptyDesc = {};

  function applyDescriptorsAndDefaults(prototype, descriptors, defaults) {
    if (Array.isArray(descriptors)) {
      var i, n, names = descriptors;
      for (i = 0, n = names.length; i < n; ++i) {
        descriptors[names[i]] = emptyDesc;
      }
    }

    descriptors = assign({}, prototype.__descriptors__, descriptors);

    var key, desc;

    if (defaults) { // merge defaults into descriptors
      for (key in defaults) {
        if (defaults.hasOwnProperty(key) && !descriptors.hasOwnProperty(key)) {
          descriptors[key] = emptyDesc;
        }
      }
    }

    for (key in descriptors) { // define getter/setter for each key
      if (descriptors.hasOwnProperty(key) && !prototype.hasOwnProperty(key)) {
        Accessor.define(prototype, key);
        desc = descriptors[key] || emptyDesc;
        descriptors[key] = typeof desc !== 'object' ? {type: desc} : desc;
      }
    }

    Object.defineProperty(prototype, '__descriptors__', {value: descriptors});
  }

  function Component(props) {
    this.register();

    Component.initialize(this, props);

    this.ready();
  }

  Exact.defineClass({
    constructor: Component, extend: Shadow,

    mixins: [Watcher.prototype, Accessor.prototype],

    __descriptors__: { contents: emptyDesc },

    statics: {
      //descriptors: { contents: null },

      /**
       * Factory method for creating a component
       *
       * @param {Function} ClassRef
       * @param {Object} props
       * @returns {Component}
       */
      create: function create(ClassRef, props) {
        return new ClassRef(props);
      },

      /**
       * Initialize this component, using template.
       *
       * @param {Component} component
       * @param {Object} props
       */
      initialize: function initialize(component, props) {
        var constructor = component.constructor, prototype = constructor.prototype, _template = constructor._template,
          resources = constructor.resources, descriptors = constructor.descriptors, defaults = constructor.defaults;

        if (!_template) {
          var template = constructor.template;

          if (template) {
            _template = Exact.HTMXParser.parse(template, resources);
          }

          if (_template) {
            constructor._template = _template;
          } else {
            throw new TypeError('The template must be legal HTML string or DOM element');
          }
        }

        Shadow.initialize(component, _template.tag, _template.ns);
        
        defaults = typeof defaults === 'function' ? defaults() : null;

        if (!prototype.hasOwnProperty('__descriptors__')) {
          applyDescriptorsAndDefaults(prototype, descriptors, defaults); //
        }

        component.save(props ? assign({}, defaults, props) : defaults);

        Exact.HTMXCompiler.compile(_template, component);

        //component.send('initialized');
      }

    },

    //bindable: true,

    get: function(key) {
      var props = this._props, descriptors = this.__descriptors__;
      var desc = descriptors[key], get = desc.get;

      return get ? get.call(this, props) : props[key];
    },

    set: function set(key, val) {
      var props = this._props, descriptors = this.__descriptors__;

      var old, desc = descriptors[key];
      
      if (desc) {
        if (!Validator.validate(this, key, val, desc)) { return; }

        var coerce = desc.coerce, get = desc.get, set = desc.set;

        old = get ? get.call(this) : props[key];

        if (coerce) {
          val = coerce.call(this, val);
        }

        if (val !== old) {
          if (set) {
            set.call(this, val);
          } else {
            props[key] = val;
          }

          if (desc.native) {
            DirtyMarker.check(this, key, val, old);
          }

          this.send('changed.' + key, val, old);

          this.invalidate();//TODO:
        }
      } else {
        old = props[key];

        if (val !== old) {
          props[key] = val;

          DirtyMarker.check(this, key, val, old);

          this.invalidate();
        }
      }
    },

    /**
     * @abstract
     */
    register: function register() {},

    /**
     * @abstract
     */
    ready: function ready() {},

    /**
     * @abstract
     */
    refresh: function refresh() {},

    /**
     * @abstract
     */
    release: function release() {}

  });

  Exact.Component = Component;

})();

//######################################################################################################################
// src/core/bindings/Binding.js
//######################################################################################################################
(function() {

  function Binding() {}

  Exact.defineClass({
    constructor: Binding,

    statics: {
      assign: function assign(target, key, val) {
        if (target.set) {
          target.set(key, val);
        } else {
          target[key] = val;
        }
      },

      record: function record(target, binding) {
        var _bindings = target._bindings;

        if (_bindings) {
          _bindings.push(binding);
        } else {
          Object.defineProperty(target, '_bindings', {
            value: [binding], writable: false, enumerable: false, configurable: true
          });
        }
      },

      remove: function remove(target, binding) {
        var _bindings = target._bindings;

        _bindings.splice(_bindings.lastIndexOf(binding), 1);
      }
    }
  });

  Exact.Binding = Binding;

})();

//######################################################################################################################
// src/core/bindings/DataBinding.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;
  var Binding = Exact.Binding;
  var PathUtil = Exact.PathUtil;
  var Evaluator = Exact.Evaluator;
  var Collection = Exact.Collection;

  var MODES = { ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2 };

  function DataBinding(
    mode,

    context,
    locals,
    target,
    source,

    evaluator,
    converters,

    targetProp,
    sourceProp,

    event,
    paths
  ) {
    this.mode = mode;

    this.context = context;
    this.locals = locals;
    this.target = target;
    this.source = source;

    this.evaluator = evaluator;
    this.converters = converters;

    this.targetProp = targetProp;
    this.sourceProp = sourceProp;

    this.event = event;
    this.paths = paths;

    this.exec = this.exec.bind(this); // TODO: use different exec in different mode

    if (mode === MODES.TWO_WAY) {
      this.back = this.back.bind(this);
    }
  }

  Exact.defineClass({
    constructor: DataBinding, //extend: Binding,

    statics: {

      MODES: MODES,

      compile: function(template, targetProp, target, context, locals) {
        var mode = template.mode,
          paths = template.paths,
          event = template.event,
          evaluator = template.evaluator,
          converters = template.converters;

        locals = locals || [];

        if (mode === MODES.TWO_WAY) {
          var i, source, sourceProp, path;

          path = paths[0];
          i = path.length - 1;
          sourceProp = path[i];
          source = RES.search(path.slice(0, i), locals[path.origin], true);
        }

        var binding = new DataBinding(
          mode,

          context,
          locals,
          target,
          source,

          evaluator,
          converters,

          targetProp,
          sourceProp,

          event,
          event ? null : paths
        );
        // TODO: use different exec in different mode

        //var collection = Exact.Dep.begin(binding);
        binding.exec();
        //Exact.Dep.end();
        //console.log(collection);

        var flag;

        var method = mode === MODES.ONE_TIME ? 'once' : 'on';

        if (!event) {
          flag = eye(method, paths, locals, binding.exec);
        } else {
          context.on(event, binding.exec);
          flag = 1;
        }

        if (flag) {
          Binding.record(target, binding);
        }

        if (mode === MODES.TWO_WAY && target.on) {
          target.on('changed.' + targetProp, binding.back);
          //record(source, binding);
        }

        return binding;
      },

      clean: function(binding) {
        var flag,
          mode = binding.mode,
          target = binding.target,
          locals = binding.locals,
          context = binding.context;

        if (mode === MODES.ONE_TIME) { return; }

        if (!binding.event) {
          flag = eye('off', binding.paths, locals, binding.exec);
        } else if (context.off) {
          context.off(binding.event, binding.exec);
          flag = 1;
        }

        if (flag) {
          Binding.remove(target, binding);
        }

        if (binding.mode === MODES.TWO_WAY && target.off)  {
          target.off('changed.' + binding.targetProp, binding.back);
          //remove(binding.source, binding);
        }
      }
    },

    exec: function() { // TODO: back()
      var value,

        locals = this.locals,
        evaluator = this.evaluator,
        converters = this.converters,

        //source = this.source, sourceProp = this.sourceProp,
        target = this.target, targetProp = this.targetProp;

      value = Evaluator.activate(evaluator, 'exec', locals);
      if (converters) {
        value = applyConverters(converters, 'exec', locals, value);
      }
      Binding.assign(target, targetProp, value);

      if (this.mode === MODES.ONE_TIME) {
        DataBinding.clean(this);
      }
    },

    back: function back() {
      var value,

        locals = this.locals,
        //evaluator = this.evaluator,
        converters = this.converters,

        source = this.source, sourceProp = this.sourceProp,
        target = this.target, targetProp = this.targetProp;

      value = target[targetProp];
      if (converters) {
        value = applyConverters(converters, 'back', locals, value);
      }
      Binding.assign(source, sourceProp, value);
    }
  });

  function applyConverters(converters, name, locals, value) {
    var i, begin, end, step, evaluator;//, exec, rest, args;

    if (!converters.length) { return value; }

    if (name === 'exec') {
      begin = 0;
      step = +1;
      end = converters.length;
    } else { // name === 'back';
      begin = converters.length - 1;
      step = -1;
      end = -1;
    }

    for (i = begin; i !== end; i += step) {
      evaluator = converters[i];
      value = Evaluator.activate(evaluator, name, locals, value);
    }

    return value;
  }

  function dep(i, prop, paths, source, origin) {
    var descriptors = source.__descriptors__;

    var desc = descriptors && descriptors[prop];

    if (desc && desc.depends) {
      var j, n, path, depends = desc.depends;

      for (j = 0, n = depends.length; j < n; ++j) {
        path = PathUtil.parse(depends[j]); //TODO:
        path.origin = origin;
        paths.push(path);
      }

      paths[i] = null;

      return true;
    }
  }

  function eye(method, paths, locals, handler) {
    if (!locals || !paths || !paths.length) { return 0; }

    var i, j, path, prop, flag = 0, local, source;

    for (i = 0; i < paths.length; ++i) {
      path = paths[i];

      if (!path) { continue; }

      j = path.length - 1;
      local = locals[path.origin];
      prop = path[j];
      source = j < 1 ? local : RES.search(path.slice(0, j), local, true);

      if (method === 'on' && dep(i, prop, paths, source, path.origin)) {
        continue;
      }

      if (source && source[method] /*&& source.bindable*/) {
        source[method]('changed.' + prop, handler);
        // TODO:
        //if (i === 0) { // Check if the first variable is a collection. It is important for `x-for` expression.
        //  source.on('changed.' + prop, function(event, target, old) {
        //    if (old && old instanceof Collection) {
        //      old.off('changed', handler);
        //    }
        //    if (target && target instanceof Collection) {
        //      target[method]('changed', handler);
        //    }
        //  });
        //
        //  var target = source[prop];
        //  if (target && target instanceof Collection) {
        //    target[method]('changed', handler);
        //  }
        //}

        flag = 1;
      } else {
        paths[i] = null;
      }
    }

    return flag;
  }

  Exact.DataBinding = DataBinding;

})();

//##############################################################################
// src/core/bindings/TextBinding.js
//##############################################################################
(function() {

  var Container = Exact.Container;
  var Binding = Exact.Binding;
  var Expression = Exact.Expression;
  var DataBinding = Exact.DataBinding;
  var DirtyMarker = Exact.DirtyMarker;

  var Array$join = Array.prototype.join;

  function TextBinding(property, target, context, container) {
    this.exec = this.exec.bind(this);

    this.property = property;
    this.target = target;
    this.context = context;
    this.container = container;
  }

  Exact.defineClass({
    constructor: TextBinding, //extend: Binding,

    statics: {
      /**
       *
       * @param {Array} template - pieces of strings and expressions
       * @param {string} property
       * @param {Object} target
       * @param {Object} context
       * @param {Object} locals
       */
      compile: function(template, property, target, context, locals) {
        var i, n, piece, container = Container.create(null, context.invalidate);

        for (i = 0, n = template.length; i < n; ++i) {
          piece = template[i];

          if (piece instanceof Expression) {
            Expression.activate(piece, i, container, context, locals);
          } else {
            container[i] = piece;
          }
        }

        container.length = n;

        var binding = new TextBinding(property, target, context, container);
        Binding.record(target, binding);
        binding.exec();

        context.on('updated', binding.exec);
      },

      clean: function clean(binding) {
        binding.context.off('updated', binding.exec);

        var bindings = binding.container._bindings;

        if (bindings) {
          for (var i = bindings.length - 1; i >= 0; --i) {
            DataBinding.clean(bindings[i]);
          }
        }

        Binding.remove(binding.target, binding);
      }
    },

    exec: function exec() {
      var container = this.container;

      if (!container.hasDirty()) { return; }

      Binding.assign(this.target, this.property, Array$join.call(container, ''));

      DirtyMarker.clean(container);
    }
  });

  Exact.TextBinding = TextBinding;

})();

//######################################################################################################################
// src/core/bindings/EventBinding.js
//######################################################################################################################
(function() {

  var Evaluator = Exact.Evaluator;

  function EventBinding() {
    this.evaluator = null;
    this.handler = '';
  }

  EventBinding.compile = function(template, type, target, context, locals) {
    var handler = template.handler, evaluator = template.evaluator;

    if (handler) {
      target.on(type, context[handler]/*.bind(context)*/);
    } else {
      locals = [null].concat(locals || []);
      target.on(type, function(event) {
        locals[0] = event; // TODO: if emit, event should be ignored
        Evaluator.activate(evaluator, 'exec', locals);
      });
    }
  };

  Exact.EventBinding = EventBinding;

})();

//######################################################################################################################
// src/core/templates/HTMXTemplate.js
//######################################################################################################################
(function() {

  function HTMXTemplate() {
    this.ns = '';
    this.tag = '';
    this.type = null;

    this.key = '';
    this.ref = '';

    this.props = null;
    this.attrs = null;
    this.style = null;
    this.classes = null;
    this.actions = null;
    this.directs = null;
    this.children = null;

    this.actual = false; // if prop value is actual
  }

  /**
   * e.g. create('div', null, [
   *        create('h1', null, 'title'),
   *        create('ul', null,
   *          create('a', {
   *              'href@': 'link.url',
   *              classes: {link: true, 'active@': 'link.active'},
   *              directs: {'for': 'link of $.links', key: 'link.url'}
   *            },
   *            ['tip: @{ link.tip }']
   *          )
   *        ),
   *        create(Button, { label: 'OK', 'click+': '$.onClick' })
   *      ])
   *
   * @param {string|Function} tagOrType
   * @param {Object} params
   * @param {string|Array|HTMXTemplate} children
   * @returns {HTMXTemplate}
   */
  function create(tagOrType, params, children) {
    var template = new HTMXTemplate();
    // if there is no expression for prop, the value assigned to the prop must be actual,
    // e.g. { score: 10 } instead of { score: '10' } if `score` is number
    template.actual = true;

    if (typeof tagOrType === 'string') {
      template.tag = tagOrType;
    } else if (typeof tagOrType === 'function') {
      template.type = tagOrType;
    } else {
      throw new TypeError('');
    }

    if (params) {
      if (!template.type) {
        template.ns = params.ns || '';
      }

      template.key = params.key;    // not for string or DOM template
      template.actions = params.on; // not for string or DOM template

      template.ref = params.ref;
      template.style = params.style;
      template.attrs = params.attrs;
      template.classes = params.classes;
      template.directs = params.directs;

      var props = template.props = {};

      for (var key in params) {
        if (params.hasOwnProperty(key) && !template.hasOwnProperty(key)) {
          props[key] = params[key];
        }
      }
    }

    if (children != null && !Array.isArray(children)) {
      children = [children];
    }

    template.children = children;

    return template;
  }

  HTMXTemplate.create = create;
  //HTMXTemplate.parse = null;

  Exact.HTMXTemplate = HTMXTemplate;

})();
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
            if (dst === old) { return; }
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

    if ('development' === 'development') {
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

//######################################################################################################################
// src/core/parsers/EvaluatorParser.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;

  var PathUtil = Exact.PathUtil;
  var StringUtil = Exact.StringUtil;
  var LiteralUtil = Exact.LiteralUtil;

  var Evaluator = Exact.Evaluator;

  var ARGUMENT_FLAGS = Evaluator.ARGUMENT_FLAGS;

  var PATH_REGEXP = /^[\w\$]+((\[|\]?\.)[\w\$]+)*$/;                  // a[0].b.c, path
  var PATH_FUNC_REGEXP = /^!?[\w\$]+((\[|\]?\.)[\w\$]+)*(\(.*\))?$/;  // !$.a[0].b.c(), path or func

  //function $get(val) { return val; }
  function $get(val) { return arguments[arguments.length - 1]; }
  function $not(val) { return !val; }

  function makeEvaluator(exec, args, back) {
    return Evaluator.create(exec, args, back);
  }

  function makeGetEvaluator(args) {
    return Evaluator.create($get, args);
  }

  function makeNotEvaluator(args) {
    return Evaluator.create($not, args);
  }

  function makeExpressionEvaluator(expr, identifiers) { // TODO: EvaluatorParser.parse
    var n = identifiers.length;
    
    var args = [], flags = [];
    
    for (var i = 0; i < n; ++i) {
      args.push({origin: i});
      flags.push(ARGUMENT_FLAGS.LOCAL_PATH);
    }

    args.flags = flags;

    var body = makeFunctionBody(expr);

    var exec = Function.apply(null, identifiers.concat([body]));

    return Evaluator.create(exec, args);
  }

  function makeFunctionBody(expr) {
    if ('development' === 'development') {
      return 'try { return ' + expr + '; } catch (error) { console.error("the expression `' + expr + '` is illegal"); throw error; }';
    } else {
      return 'return ' + expr + ';';
    }
  }

  function parseArgs(args, resources, identifiers) { //TODO: 1, $.b, red, exec(), $.f()
    var arg, path, flag, flags, index, res;

    for (var i = 0, n = args.length; i < n; ++i) {
      arg = args[i];
      res = undefined;
      flag = ARGUMENT_FLAGS.INVARIABLE;

      res = LiteralUtil.parse(arg);

      if (res === undefined) {
        if (PATH_REGEXP.test(arg)) { //TODO
          path = PathUtil.parse(arg);
          index = identifiers.indexOf(path[0]);
          if (index < 0) {
            res = RES.search(path, resources);
          } else {
            res = path;
            path.shift();
            path.origin = index;
            flag = ARGUMENT_FLAGS.LOCAL_PATH;
          }
        } else {
          flag = ARGUMENT_FLAGS.EVALUATOR;
          res = parseEvaluator(arg, resources, identifiers);
        }
      }

      args[i] = res;

      if (flag) {
        flags = flags || [];
        flags[i] = flag;
      }
    }

    args.flags = flags;

    return args;
  }

  function parseEvaluator(expr, resources, identifiers) {
    var i, j, k, res, path, args, flags, index, evaluator;

    if (PATH_FUNC_REGEXP.test(expr)) {
      i = expr.indexOf('!');
      j = expr.indexOf('(');

      if (j < 0) { // path, not function
        path = expr.slice(i !== 0 ? 0 : 1);

        res = LiteralUtil.parse(path); // true or false

        if (res === undefined) {
          path = PathUtil.parse(path);
          index = identifiers.indexOf(path[0]);
          if (index < 0) {
            res = RES.search(path, resources);
          } else {
            res = path;
            path.shift();
            path.origin = index;
            flags = [ARGUMENT_FLAGS.LOCAL_PATH];
          }
        }

        args = [res];
        args.flags = flags;

        evaluator = i !== 0 ? makeGetEvaluator(args) : makeNotEvaluator(args);
      } else { // function, possibly
        var range = StringUtil.range(expr, j, '', '()');

        if (range && range[1] === expr.length) {
          path = expr.slice(i < 0 ? 0 : 1, j);
          args = StringUtil.split(expr.slice(j + 1, expr.length - 1), ',', '()');
          args = args.length ? parseArgs(args, resources, identifiers) : null;

          //if (path) {
            path = PathUtil.parse(path);
            index = identifiers.indexOf(path[0]);
            if (path.length > 1 && index >= 0) {
              path.origin = index;
              path.shift();

              evaluator = {
                path: path,
                args: args
              }
            } else {
              res = RES.search(path, resources); // TODO: but maybe x-for="f of fs", @{f()}

              if (!res) {
                throw new Error('can not find such resource `' + path + '`');
              } else if (!res.exec) {
                evaluator = makeEvaluator(res, args);
              } else {
                evaluator = makeEvaluator(res.exec, args, res.back);
              }
            }

            if (i === 0) {
              args = [evaluator];
              args.flags = [ARGUMENT_FLAGS.EVALUATOR]; //TODO: EvaluatorUtil.setFlag(args, index, EvaluatorUtil.FLAG_EVAL)
              evaluator = makeNotEvaluator(args);
            }
          //} else { // @{ (1, 2, $.title) } will return $.title
          //  evaluator = i !== 0 ? makeGetEvaluator(args) : makeNotEvaluator(args);
          //}
        }

      }
    }

    if (!evaluator) {
      evaluator = makeExpressionEvaluator(expr, identifiers);
    }

    return evaluator;
  }

  Exact.EvaluatorParser = {
    /**
     * @param {string} expr
     * @param {Object} resources
     * @returns {Evaluator}
     */
    parse: parseEvaluator
  };

})();

//######################################################################################################################
// src/core/parsers/EventBindingParser.js
//######################################################################################################################
(function() {

  var Expression = Exact.Expression;
  var EventBinding = Exact.EventBinding;
  var EvaluatorParser = Exact.EvaluatorParser;

  /* /^\$\.[\w\$]+$/ */
  var OFFSET = Exact.CONTEXT_SYMBOL.length + 1;
  var HANDLER_REGEXP = new RegExp('^\\' + Exact.CONTEXT_SYMBOL + '\\.[\\w\\$]+$');

  function parse(expr, resources, identifiers) {
    expr = expr.trim();

    var template = {};

    if (HANDLER_REGEXP.test(expr)) {
      template.handler = expr.slice(OFFSET); // TODO:
    }  else {
      template.evaluator = EvaluatorParser.parse(expr, resources, ['event'].concat(identifiers));
    }

    return Expression.create(EventBinding, template);
  }

  Exact.EventBindingParser = {
    parse: parse
  };

})();

//######################################################################################################################
// src/core/parsers/DataBindingParser.js
//######################################################################################################################
(function() {

  var PathUtil = Exact.PathUtil;
  var StringUtil = Exact.StringUtil;

  var Expression = Exact.Expression;
  var DataBinding = Exact.DataBinding;

  var EvaluatorParser = Exact.EvaluatorParser;

  var EVENT_OPERATOR = Exact.EVENT_OPERATOR;//'*';

  var BINDING_OPERATORS = Exact.BINDING_OPERATORS;

  var DATA_BINDING_MODES = DataBinding.MODES;

  /* /\*(\w(\.\w+)?)*[ ]*$/ */
  var EVENT_REGEXP = new RegExp('\\' + EVENT_OPERATOR + '(\\w(\\.\\w+)?)*[ ]*$');

  var PATH_REGEXP = /^[\w\$]+((\[|\]?\.)[\w\$]+)+$/;

  var PATH_FUNC_REGEXP = /[\w\$]+((\[|\]?\.)[\w\$]+)+\(?/g;

  function collectPaths(expr, paths, identifiers) {
    var matches, match, path;//, paths = [];

    matches = expr.match(PATH_FUNC_REGEXP);

    if (!matches) { return; }

    for (var i = 0, n = matches.length; i < n; ++i) {
      match = matches[i];

      path = PathUtil.parse(match);

      if (match[match.length - 1] === '(') {
        path.pop();
      }

      if (path.length < 2) { continue; }

      for (var j = 0, m = identifiers.length; j < m; ++j) {
        if (path[0] === identifiers[j]) {
          path.shift();
          path.origin = j;
          paths.push(path);
        }
      }
    }
  }

  /**
   *
   * @param {string} operator
   * @param {string} expr
   * @param {Object} resources
   * @param {Array} identifiers
   * @returns {*}
   */
  function parse(operator, expr, resources, identifiers) { //TODO: parse(operator, expression, resources)
    var mode = -1, tail = '', event, i, j;

    switch (operator) {
      case BINDING_OPERATORS.ONE_TIME:
        mode = DATA_BINDING_MODES.ONE_TIME;
        break;
      case BINDING_OPERATORS.ONE_WAY:
        mode = DATA_BINDING_MODES.ONE_WAY;
        break;
      case BINDING_OPERATORS.TWO_WAY:
        mode = DATA_BINDING_MODES.TWO_WAY;
        break;
      default :
        return null;
    }

    if (EVENT_REGEXP.test(expr)) {
      i = expr.lastIndexOf(EVENT_OPERATOR);

      tail = expr.slice(i + 1);
      expr = expr.slice(0, i);

      event = tail.trim();

      if (!event) {
        event = 'updated';
      }
    }

    var piece, pieces = StringUtil.split(expr, '|', '()'),  converters, evaluator, n;

    piece = pieces[0].trim();

    if (mode === DATA_BINDING_MODES.TWO_WAY && !PATH_REGEXP.test(piece)) {
      throw new Error('Illegal two-way binding expression `' + expr + '`');
    }

    evaluator = EvaluatorParser.parse(piece, resources, identifiers);

    if (!event) {
      var paths = [];
      collectPaths(piece, paths, identifiers);
    }

    if (pieces.length > 1) {
      converters = [];

      for (i = 1, n = pieces.length; i < n; ++i) {
        piece = pieces[i].trim();

        if (piece[piece.length - 1] !== ')') {
          piece += '()';
        }

        if (!event) {
          collectPaths(piece, paths, identifiers);
        }

        converters.push(EvaluatorParser.parse(piece, resources, identifiers));
      }

      if ('development' === 'development') {
        if (n > 2) {
          console.warn(expr, 'better not use converters more than 2');
        }
      }
    }

    var template = {
      mode: mode,
      event: event,
      paths: paths,
      evaluator: evaluator,
      converters: converters
    };

    return Expression.create(DataBinding, template);
  }

  Exact.DataBindingParser = {
    parse: parse
  }

})();

//######################################################################################################################
// src/core/parsers/TextBindingParser.js
//######################################################################################################################
(function() {

  var StringUtil = Exact.StringUtil;
  var Expression = Exact.Expression;
  var TextBinding = Exact.TextBinding;
  var DataBindingParser = Exact.DataBindingParser;
  var BINDING_OPERATORS = Exact.BINDING_OPERATORS;
  
  var DATA_BINDING_BRACKETS = Exact.DATA_BINDING_BRACKETS;//'{}';//

  var BINDING_LIKE_REGEXP = new RegExp(
    '['+ BINDING_OPERATORS.ONE_TIME + BINDING_OPERATORS.ONE_WAY + BINDING_OPERATORS.TWO_WAY +']\\'
    + DATA_BINDING_BRACKETS[0]// + '.+\\' + DATA_BINDING_BRACKETS[1]
  );

  Exact.TextBindingParser = {
    like: function like(expr) {
      return BINDING_LIKE_REGEXP.test(expr);
    },
    /**
     * @param {string} expr
     * @param {Object} resources
     * @param {Array} parameters
     * @returns {*}
     */
    parse: function(expr, resources, parameters) { //TODO:
      var i, j, indices = [0], template = [], piece;

      var range0 = StringUtil.range(expr, -1, BINDING_OPERATORS.ONE_TIME, DATA_BINDING_BRACKETS);
      var range1 = StringUtil.range(expr, -1, BINDING_OPERATORS.ONE_WAY, DATA_BINDING_BRACKETS);

      if (!range0 && !range1) { return null; }

      while (range1 || range0) {
        if (range1) {
          if (range0 && range0[0] < range1[0]) {
            i = range0[0];
            j = range0[1];
            range0 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_TIME, DATA_BINDING_BRACKETS);
          } else {
            i = range1[0];
            j = range1[1];
            range1 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_WAY, DATA_BINDING_BRACKETS);
          }
        } else {
          if (range1 && range1[0] < range0[0]) {
            i = range1[0];
            j = range1[1];
            range1 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_WAY, DATA_BINDING_BRACKETS);
          } else {
            i = range0[0];
            j = range0[1];
            range0 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_TIME, DATA_BINDING_BRACKETS);
          }
        }

        indices.push(i, j);
      }

      indices.push(expr.length);

      for (i = 0, j = indices.length - 1; i < j; ++i) {
        piece = expr.slice(indices[i], indices[i+1]);

        if (i % 2) {
          template[i] = DataBindingParser.parse(piece[0], piece.slice(2, piece.length - 1), resources, parameters);
        } else {
          template[i] = piece;
        }
      }

      return Expression.create(TextBinding, template);
    }
  };

})();

//######################################################################################################################
// src/core/parsers/HTMLParser.js
//######################################################################################################################
(function() {
  var RES = Exact.RES;
  var Skin = Exact.Skin;
  var HTMXTemplate = Exact.HTMXTemplate;

  function parseData(expr, camel) {
    var pieces = expr.split(/;/g), piece, data = {}, name, key, n, i, j;

    for (i = 0, n = pieces.length; i < n; ++i) {
      piece = pieces[i];

      j = piece.indexOf(':');

      if (j > 0 ) {
        expr = piece.slice(j + 1).trim();
        name = piece.slice(0, j).trim();

        key = camel ? Skin.toCamelCase(name) : name;

        data[key] = expr;
      }
    }

    return data;
  }

  function parseSelf(template, $template, resources) {
    template.ns = Skin.getNameSpace($template);
    template.tag = Skin.getTagName($template);

    var type = Skin.toCamelCase(template.tag);
    template.type = RES.search(type[0].toUpperCase() + type.slice(1), resources);

    var $attrs = Skin.getAttrs($template);

    if (!$attrs) { return; }

    if ($attrs['x-attrs']) {
      template.attrs = parseData($attrs['x-attrs']);
      delete $attrs['x-attrs'];
    }

    if ($attrs['x-style']) {
      template.style = parseData($attrs['x-style'], true);
      delete $attrs['x-style'];
    }

    if ($attrs['x-class']) {
      template.classes = parseData($attrs['x-class'], true);
      delete $attrs['x-class'];
    }

    if ($attrs['x-type']) {
      //template.attrs = template.attrs || {};
      //template.attrs['x-ref'] = $attrs['x-type'];

      template.type = RES.search($attrs['x-type'], resources);
      delete $attrs['x-type'];

      if (!template.type) {
        throw new TypeError('can not find such type `' + $attrs['x-type'] + '`');
      }
    }

    if ($attrs['x-ref']) {
      template.ref = $attrs['x-ref'];
      delete  $attrs['x-ref'];

      //template.attrs = template.attrs || {};
      //template.attrs['x-ref'] = template.ref;
    }

    var directs = {}, flag;

    if ($attrs['x-if']) {
      directs.xIf = $attrs['x-if'];
      delete $attrs['x-if'];
      flag = true;
    }

    if ($attrs['x-for']) {
      directs.xFor = $attrs['x-for'];
      delete $attrs['x-for'];
      flag = true;
    }

    if ($attrs['x-key']) {
      directs.xKey = $attrs['x-key'];
      delete $attrs['x-key'];
      flag = true;
    }

    if (flag) {
      template.directs = directs;
    }

    // props and events
    var props = {}, name, key;

    for (name in $attrs) {
      if ($attrs.hasOwnProperty(name)) {
        key = Skin.toCamelCase(name);
        props[key] = $attrs[name];
      }
    }

    template.props = props;
  }

  function parseChildren(template, $template, resources) {
    var $children = Skin.getChildren($template);

    var $child, children = [], i, n;

    for (i = 0,  n = $children.length; i < n; ++i) {
      $child = $children[i];

      if (Skin.isComment($child)) { continue; }

      if (Skin.isElement($child)) {
        var child = new HTMXTemplate();

        parseSelf(child, $child, resources);
        parseChildren(child, $child, resources);

        children.push(child);
      } else if (Skin.isText($child)) {
        children.push(Skin.getProp($child, 'data'));
      }
    }

    if (children.length) {
      template.children = children;
    }
  }

  function parse($template, resources) {
    resources = resources || {};

    if (typeof $template === 'string') {
      $template = Skin.parse($template.trim())[0];
    }

    if (!Skin.isElement($template)) {
      throw new TypeError('template must be DOM element or HTML string that contains a root tag');
    }

    var template = new HTMXTemplate();

    parseSelf(template, $template, resources);

    parseChildren(template, $template, resources);

    return template;
  }

  Exact.HTMLParser = {
    parse: parse
  };

  //Exact.HTMXTemplate.parse = parse;

})();
//######################################################################################################################
// src/core/parsers/HTMXParser.js
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
      Object.defineProperty(data, 'expressions', {
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

  function parseParams(_template, parameters, resources, name, actual) {
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
      } else if (!actual) {
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

    parseParams(_template, template.props, resources, 'props', template.actual);
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

})();

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

//######################################################################################################################
// src/exit.js
//######################################################################################################################
//(function(global, module) {
//  'use strict';
//
//  var Exact = { version: '0.0.8' };

  global = global || window || {};

  if (module) {
    module.exports = Exact;
  } else {
    global.Exact = Exact;
  }

  Exact.global = global;

})(typeof global !== 'undefined' ? global : null, typeof module !== 'undefined' ? module : null);
