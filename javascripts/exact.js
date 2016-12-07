//######################################################################################################################
// src/entry.js
//######################################################################################################################
(function(global, module) {
  'use strict';

  var Exact = { version: '0.0.3' };

//  if (module) {
//    module.exports = Exact;
//  } else {
//    global = global || window || {};
//    global.Exact = Exact;
//    Exact.global = global;
//  }
//
//})(typeof global !== 'undefined' ? global : undefined, typeof module !== 'undefined' ? module : undefined);

//######################################################################################################################
// src/utils/ObjectUtil.js
//######################################################################################################################
(function() {
  'use strict';

  var features = {};

  features.seal = 'seal' in Object;
  features.freeze = 'freeze' in Object;

  try {
    Object.defineProperty({}, 'x', {get: function() {}, set: function() {}});
    features.accessor = true;
  } catch (error) {
    features.accessor = false;
  }
  //features.accessor = false;

  function getDescriptor(object, key) {
    return {value: object[key]};
  }

  function defineProp(object, key, desc) {
    if (!desc || typeof desc !== 'object') {
      throw new Error('');
    }

    object[key] = desc.value;
  }

  function assign(target/*,..sources*/) {
      if (target === undefined || target === null) {
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
            defineProp(target, key, getDescriptor(source, key));
          }
        }
      }

      return target;
    }

  /**
   * Clone a object.
   *
   * @param {Object} source
   * @param {number} depth
   * @returns {Object}
   */
  function clone(source, depth) {
    if (depth === undefined) {
      depth = -1; // clone completely
    }

    var key, target, constructor;

    if (!(source instanceof Object) || !source || !depth) {
      return source;
    }

    if (typeof source === 'function') {
      target = function() { return source.apply(this, arguments); };
    } else {
      constructor = source.constructor;

      target = new constructor();

      for (key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = clone(source[key], depth - 1);
        }
      }
    }

    return target;
  }

  var Array$push = Array.prototype.push;
  var Array$splice = Array.prototype.splice;
  var Array$unshift = Array.prototype.unshift;

  var UPDATE_COMMANDS = { //TODO: as outer const
    '$set': true, '$push': true, '$unshift': true, '$splice': true, '$apply': true, '$assign': true
  };

  /**
   * Update some parts of a object.
   *
   * @example update({items: [1,2,3]}, {items: {$push: [4]}})
   *
   * @param {Object} source
   * @param {Object} specs
   * @returns {Object}
   */
  function update(source, specs) {
//      if (!(source instanceof Object) || !source) {
//        return source;
//      }
    if (typeof specs !== 'object' || !specs) { return; }

    if (specs.hasOwnProperty('$set')) { //$equal
      return specs['$set'];
    }

    var key, target = clone(source, 1);

    if (specs.hasOwnProperty('$assign')) {
      assign(target, specs['$assign']);
    } else if (specs.hasOwnProperty('$push')) {
      Array$push.apply(target, specs['$push']); //TODO: push as outer func
    } else if (specs.hasOwnProperty('$unshift')) {
      Array$unshift.apply(target, specs['$unshift']); //TODO: unshift as outer func
    } else if (specs.hasOwnProperty('$splice')) {
      Array$splice.apply(target, specs['$splice']); //TODO: unshift as outer func
    } else if (specs.hasOwnProperty('$apply')) {
      target = specs['$apply'](target);
    }

    for (key in specs) {
      if (specs.hasOwnProperty(key) && !UPDATE_COMMANDS.hasOwnProperty(key)) {
        target[key] = update(source[key], specs[key]);
      }
    }

    return target;
  }

  Exact.ObjectUtil = {
    assign: Object.assign || assign,

    defineProp: features.accessor ? Object.defineProperty : defineProp,

    getDescriptor: Object.getOwnPropertyDescriptor || getDescriptor,

    update: update,

    clone: clone,

    support: function support(name) {
      return features[name];
    }
  };

})();

//######################################################################################################################
// src/share/constants.js
//######################################################################################################################
(function() {

  'use strict';
  //var ObjectUtil = Exact.ObjectUtil;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;
  var PATH_DEMILITER = /\[|\]?\./;

  /**
   * Find the resource in the scope
   *
   * @param {string} path
   * @param {Object} scope
   * @returns {*}
   */
  function find(path, scope) {
    if (path.indexOf('.') > 0 || path.indexOf('[') > 0) {
      path = path.split(PATH_DEMILITER);

      var i = -1, n = path.length - 1;

      while (++i < n) {
        scope = scope[path[i]];
        if (scope === undefined) {
          return;
        }
      }

      path = path[i];
    }

    return scope[path];
  }

  ObjectUtil_defineProp(Exact, 'RES', {value: {
    /**
     * Find the resource in local scope, then in global if necessary.
     *
     * @param {string} path
     * @param {Object} localScope
     * @param {boolean} notInGlobal
     * @returns {*}
     */
    search: function(path, localScope, notInGlobal) {
      if (localScope) {
        var res = find(path, localScope);
      }

      if (!res && !notInGlobal) {
        res = find(path, this);
      }

      if (!res && !notInGlobal && Exact.global) {
        res = find(path, Exact.global);
      }

      //TODO: continue to find(path, window);

      return res;
    },

    /**
     *
     * @param {string} path
     * @param {*} value
     * @param {boolean} override
     * @returns {boolean}
     */
    register: function(path, value, override) {
      var temp, target = this;

      if (path.indexOf('.') > 0 || path.indexOf('[') > 0) {
        path = path.split(PATH_DEMILITER);

        var i = -1, n = path.length - 1;

        while (++i < n) {
          temp = target[path[i]];

          if (temp === undefined) {
            temp = target[path[i]] = {};
          } else if (typeof temp !== 'object') {
            throw new TypeError('You can not register resource to ' + typeof temp);
          }

          target = temp;
        }

        path = path[i];
      }

      if (!override && target.hasOwnProperty(path)) {
        //console.warn('already exists');
        return false;
      }

      ObjectUtil_defineProp(target, path, {value: value});

      return true;
    }
  }});

})();

//######################################################################################################################
// src/share/functions.js
//######################################################################################################################
(function() {

  'use strict';

  var ObjectUtil_assign = Exact.ObjectUtil.assign;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;
  var ObjectUtil_getDescriptor = Exact.ObjectUtil.getDescriptor;

  var helper = {
    bind: function() {
      var name, method, target = this.target;

      if (typeof arguments[0] !== 'object') { // no extras
        for (var i = 0, n = arguments.length; i < n; ++i) {
          name = arguments[i];
          method = target[name];

          if (typeof method === 'function') {
            target[name] = method.bind(target);
          }
        }
      } else { // with extra parameters
        var options = arguments[0];
        for (name in options) {
          if (options.hasOwnProperty(name)) {
            method = target[name];

            if (typeof method === 'function') {
              target[name] = method.bind.apply(method, [target].concat(options[name]));
            }
          }
        }
      }
    }
  };

  Exact.help = function help(target) {
    helper.target = target;
    return helper;
  };

  //Exact.setImmediate = function(func) {
  //  setTimeout(func, 0);
  //};

  Exact.setImmediate = (function(setImmediate, requestAnimationFrame) {
    if (!setImmediate) {
      setImmediate = requestAnimationFrame || function(func) {
          setTimeout(func, 0);
        }
    }

    return setImmediate;
  })(typeof setImmediate !== 'undefined' ? setImmediate : null,
    typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : null);

  function defineProps(target, sources) {
    var i, n, source;
    for (i = 0, n = sources.length; i < n; ++i) {
      source = sources[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          ObjectUtil_defineProp(target, key, ObjectUtil_getDescriptor(source, key));
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
    var subClass, superClass, mixins, statics, sources;//, ObjectUtil = Exact.ObjectUtil;

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
    subClass.prototype = Object.create(superClass.prototype);//ObjectUtil.create(superClass.prototype);

    sources = [subClass.prototype];

    mixins = props.mixins;
    if (Array.isArray(mixins)) {
      //delete props.mixins;
      sources.push.apply(sources, mixins);
    }

    sources.push(props);

    defineProps(subClass.prototype, sources);

    ObjectUtil_defineProp(subClass.prototype, 'constructor', {
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

  Exact.mergeDescriptors =  function(source, target) {
    var m = source.length, n = target.length, options = {}, descriptors = [];

    if (typeof source[m - 1] === 'object') {
      ObjectUtil_assign(options, source[m - 1]);
      --m;
    }

    if (typeof target[n - 1] === 'object') {
      ObjectUtil_assign(options, target[n - 1]);
      --n;
    }

    descriptors.push.apply(descriptors, source.slice(0, m));
    descriptors.push.apply(descriptors, target.slice(0, n));
    descriptors.push(options);

    return descriptors;
  }

})();

//######################################################################################################################
// src/utils/StringUtil.js
//######################################################################################################################
(function() {

  'use strict';

  var QUOTE_CODE = "'".charCodeAt(0);
  //var SPACE_CODE = ' '.charCodeAt(0);
  var SLASH_CODE = '\\'.charCodeAt(0);
  
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
          //cb = cc;
          iq = !iq;
          //continue;
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
          if (!piece) {
            throw new Error('Illegal argument list');
          }
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
    },

    isClosed: function(expr, i, j, brackets) {
      var ct, cc, cb, iq;

      if (expr[i] === brackets[0] && expr[j-1] === brackets[1]) {

        ct = 1;
        brackets = [brackets.charCodeAt(0), brackets.charCodeAt(1)];

        while (++i < j) {
          cc = expr.charCodeAt(i);

          if (cc === QUOTE_CODE && cb !== SLASH_CODE) {
            cb = cc;
            iq = !iq;
          }

          if (iq) {
            continue;
          }

          if (cc === brackets[1]) {
            --ct;
            if (!ct) {
              return i === j-1;
            }
          } else if (cc === brackets[0]) {
            ++ct;
          }
        }
      }

      return false;
    }
  };

})();

//######################################################################################################################
// src/utils/LiteralUtil.js
//######################################################################################################################
(function() {

  'use strict';

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
    //var i = expr.indexOf("'");
    //var j = expr.lastIndexOf("'");

    //return expr.slice(i+1, j);
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
  //var JSON_LIKE_REGEXP = /(^\[.*\]$)|(^\{.*\}$)/;
  //var JSON_LIKE_REGEXP = /(^\[(\s*"\S+"\s*:)+.*\]$)|(^\{("\S+":)+.*\}$)/;

  /**
   * Parse possible value from expression.
   *
   * @param {string} expr
   * @param {string} type
   * @returns {*}
   */
  function parse(expr, type) {
    if (typeof expr !== 'string') {
      throw new TypeError('expr must be string');
    }

    expr = expr.trim();

    if (type && typeof type === 'string') {
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
// src/utils/EvaluatorUtil.js
//######################################################################################################################
(function() {

  'use strict';

  var RES = Exact.RES;
  var emptyArray = [];
  var THIS_SYMBOL = '$'; //TODO:
  var EVENT_SYMBOL = 'event'; //TODO:
  
  var ARG_FLAG_LITE = 0;
  var ARG_FLAG_PATH = 1;
  var ARG_FLAG_EVAL = 2;

  function Evaluator(exec, args, back) {
    this.exec = exec;
    this.back = back;
    this.args = args;
  }

  //function $get(val) { return val; }
  function $get(val) { return arguments[arguments.length - 1]; }
  function $not(val) { return !val; }

  function makeEvaluator(exec, args, back) {
    return new Evaluator(exec, args, back);
  }

  function makeGetEvaluator(args) {
    return new Evaluator($get, args);
  }

  function makeNotEvaluator(args) {
    return new Evaluator($not, args);
  }

  function makeExpressionEvaluator(expr, args, rest) {
    args = args || [];
    args.event = true;

    var body = 'var ' + THIS_SYMBOL + ' = this; return ' + expr + ';';

    var list = [EVENT_SYMBOL];
    if (rest && rest.length) {
      list.push.apply(list, rest);
    }
    list.push(body);

    var exec = Function.apply(null, list);

    return new Evaluator(exec, args);
  }

  function evaluateArgs(args, flags, scope) {
    var i,  n, arg, flag;

    for (i = 0, n = flags.length; i < n; ++i) {
      flag = flags[i];

      if (!flag) { continue;} // arg is literal

      arg = args[i];

      if (flag === ARG_FLAG_PATH) {       // arg is path
        args[i] = RES.search(arg, scope, true);
        continue;
      }

      if (flag === ARG_FLAG_EVAL) {       // arg is evaluator
        args[i] = applyEvaluator(arg, 'exec', scope);
      }

    }
  }

  /**
   *
   * @param {Evaluator} evaluator
   * @param {string} name - 'exec' or 'back'
   * @param {object} scope
   * @param {Event} event
   * @param {*} value
   * @returns {*}
   */
  function applyEvaluator(evaluator, name, scope, event, value) {
    var $ = null, exec, args, flags, need,  hasFirstValue = arguments.length > 4;

    exec = evaluator[name];

    if (!exec) {
      $ = scope;
      name = evaluator.name;

      var i = name.lastIndexOf('.');

      if (i > 0) {
        $ = RES.search(name.slice(0, i), scope, true);
        name = name.slice(i + 1);
      }

      exec = $[name];
    }

    args = evaluator.args || emptyArray; //TODO: emptyArray

    flags = args.flags;
    need = args.event;

    args = args.slice(0); //copy

    if (flags && flags.length) {
      evaluateArgs(args, flags, scope);
    }

    if (hasFirstValue) {
      args.unshift(value);
    } else if (need) {
      args.unshift(event);
      $ = scope;
    }

    return exec.apply($, args);
  }

  Exact.EvaluatorUtil = {
    makeExpressionEvaluator: makeExpressionEvaluator,
    makeGetEvaluator: makeGetEvaluator,
    makeNotEvaluator: makeNotEvaluator,
    makeEvaluator: makeEvaluator,
    applyEvaluator: applyEvaluator,
    ARG_FLAG_LITE: ARG_FLAG_LITE,
    ARG_FLAG_PATH: ARG_FLAG_PATH,
    ARG_FLAG_EVAL: ARG_FLAG_EVAL
  }
})();

//######################################################################################################################
// src/utils/ExpressionUtil.js
//######################################################################################################################
(function() {
  'use strict';

  function Expression(type, template) {
    this.type = type; // indicate the type of the expression template
    this.template = template;
  }

  var ExpressionUtil = {
    isExpression: function(value) {
      return value instanceof Expression;
    },

    makeExpression: function(type, template) {
      return new Expression(type, template);
    },

    applyExpression: function(expression, scope, target, property) {
      var type = expression.type, template = expression.template;
      if (type && type.compile) {
        type.compile(template, property, target, scope);
      }
    }
  };

  Exact.ExpressionUtil = ExpressionUtil;

})();

//######################################################################################################################
// src/skins/Skin.js
//######################################################################################################################
(function() {

  'use strict';
//TODO: 分解
  var ObjectUtil = Exact.ObjectUtil;

  var PROPS_SHOULD_BE_USED = {
    'data': true, 'value': true, 'checked': true, 'selected': true, 'muted': true, 'multiple': true
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
    var $skin = this, fn = arguments[0];

    if (fn && $skin[fn]) {
      return $skin[fn].apply($skin, Array.prototype.slice.call(arguments, 1));
    }
    //throw new Error('');
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

      /**
       * @required
       * @internal
       */
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

        //try {
          parent.innerHTML = html;
        //} catch (e) {}

        return Skin.getChildrenCopy(parent);
      },

      clone: function clone($skin) {
        return $skin.cloneNode(true);
      },

      ///**
      // * @required
      // */
      //focus: function focus($skin) {
      //  return $skin.focus();
      //},
      //
      ///**
      // * @required
      // */
      //blur: function blur($skin) {
      //  return $skin.blur();
      //},
      //
      //call: function ($skin, fn) {
      //  return $skin[fn].apply($skin, Array.prototype.slice.call(arguments, 1));
      //},

      /**
       * @required
       */
      getNameSpace: function getNameSpace($skin) {
        var nsURI = Skin.getAttr($skin, 'xmlns') || Skin.getProp($skin, 'namespaceURI');

        if (!nsURI || nsURI === namespaceURIs.html) {
          return '';
        } else if (nsURI === namespaceURIs.svg) {
          return 'svg';
        } else if (nsURI === namespaceURIs.math) {
          return 'math';
        }

        //return '';
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
       * @internal
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
       * @internal
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
       * @internal
       */
      setProp: function setProp($skin, name, value) {
        //console.log($skin, $skin[name], Object.getOwnPropertyDescriptor($skin, name));
        $skin[name] = value;
      },

      removeProp: function removeProp($skin, name) {
        delete $skin[name];
      },

      getComputedStyle: function getComputedStyle($skin) {
        return window.getComputedStyle($skin);
      },

      /**
       * @required
       * @internal
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
       * @internal
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
       * @internal
       */
      appendChild: function appendChild($skin, child) {
        return $skin.appendChild(child);
      },

      /**
       * @required
       * @internal
       */
      insertChild: function insertChild($skin, child, before) {
        return $skin.insertBefore(child, before);
      },

      replaceChild: function replaceChild($skin, child, existed) {
        return $skin.replaceChild(child, existed);
      },

      /**
       * @required
       * @internal
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
        var key, classList = $skin.classList;

        if (!dirty) { return; }

        if (classList) {
          for (key in dirty) {
            if (dirty.hasOwnProperty(key)) {
              if (classes[key]) {
                classList.add(key);
              } else {
                classList.remove(key);
              }
            }
          }
        } else {
          var names = [];

          for (key in dirty) {
            if (dirty.hasOwnProperty(key) && classes[key]) {
              names.push(key);
            }
          }
          //Skin.setProp($skin, 'className', names.join(' '));
          Skin.setAttr($skin, 'class', names.join(' '));
        }
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

//######################################################################################################################
// src/base/Watcher.js
//######################################################################################################################
(function() {

  'use strict';

  var Array$slice= [].slice;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

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
   * Add DOM event or custom event listener.
   *
   * @param {Watcher} watcher
   * @param {Object|string} type
   * @param {Function} exec
   * @param {boolean} useCapture
   * @returns {Object}
   */
  function register(watcher, type, exec, useCapture) {
    var actions = watcher._actions, constructor = watcher.constructor;

    // !(exec instanceof Function)
    if (typeof exec !== 'function') { return null; }

    if (!actions) {
      ObjectUtil_defineProp(watcher, '_actions', {value: {}});
      actions = watcher._actions;// = {};
    }

    var event = getFixedEvent(type);

    var action = actions[event.type];

    //  Create action
    if (!action) {// <=> action === undefined
      action = actions[event.type] = { handlers: []/*, keys: {}, listener: null*/ }; //TODO: {handlers: [], keys: {enter: []}}
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

    handlers.unshift(handler);

    //May add DOM event listener.
    if (!('listener' in action)){
      if (typeof constructor.addEventListenerFor === 'function') {
        constructor.addEventListenerFor(watcher, event.type, useCapture);
      } else {
        handler.listener = null;
      }
    }

    return action;
  }

  /**
   * Remove DOM event or custom event listener.
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
      for (i = 0; i < n; ++i) {
        handler = handlers[i];
        if ((all || exec === handler.exec) && (!keyName || keyName === handler.keyName)) {
          handlers.splice(i, 1);
          --action.count;
          break;
        }
      }
    }

    if (handlers.length === 0) {
      if (action.listener && typeof constructor.removeEventListenerFor === 'function') {/* <=> element && ('on' + type) in element*/
        constructor.removeEventListenerFor(watcher, event.type, useCapture);
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
   * @param {Boolean} keep
   * @param {Event|string} event
   * @param {Array} params
   */
  function dispatch(watcher, keep, event, params) {
    var actions = watcher._actions, action;

    if (actions) {
      event = getFixedEvent(event);
      //TODO: fix event
      action = actions[event.type];

      if (action) {
        event.dispatcher = watcher;

        if (keep) {
          params.unshift(event); //[event].concat(params);
        }

        var i, n, exec, handler, handlers = action.handlers;

        n = handlers.length;
        // trigger handlers
        //for (i = 0; i < n; ++i) {
        for (i = n-1; i >= 0; --i) {
          handler = handlers[i];// handlers[ i ]( event.clone() );

          if (!handler || (handler.keyName && handler.keyName !== event.keyName)) { continue; }

          if (/*!event.eventPhase ||  */(event.eventPhase === 1) === !!handler.useCapture) {
            exec = handler.exec;
            exec.apply(null, params);
          }

        }
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

          if (Array.isArray(value)){//  .on({click: [function(){...}}, true]);
            register(this, type, value[0], value[1]);
          } else {//  .on({click: function(){...}});
            register(this, type, value);
          }
        }
      } else if (type) {//  .on('click', context.onClick);
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

      if (n === 0) {// .off()

        clean(this);

      } else if (t === 'string') {

        if (n === 1) {//  .off('click');
          remove(this, type);
        } else {//  .off('click', context.onClick);
          remove(this, type, exec, useCapture);
        }

      } else if (t === 'object') {
        opts = type;
        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }
          value = opts[type];
          if (Array.isArray(value)) {//  .off({click: [context.onClick, true]});
            remove(this, type, value[0], value[1]);
          } else {//  .off({click: context.onClick});
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
      dispatch(this, false, type, params);
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
      dispatch(this, true, type, params);
      return this;
    }

  });

  //TODO: freeze

  Exact.Watcher = Watcher;

})();

//######################################################################################################################
// src/base/Updater.js
//######################################################################################################################
(function() {
  //TODO: schedule...
  'use strict';

  var setImmediate = Exact.setImmediate;

  var pool = [], queue = [], cursor = 0, /*count = 0,*/ waiting = false, running = false;

  /**
   *
   * @constructor
   */
  function Updater() {
    throw new Error('');
  }

  Exact.defineClass({
    constructor: Updater,

    statics: {
      /**
       * target to be inserted must have method `update`
       * @param {Object} target
       */
      insert: function(target) {
        if (!target) { return; }

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

          //if ('development' === 'development') {
          //  Exact.Shadow.refreshed = 0;
          //}
        }
      },

      /**
       * target to be appended must have method `render`
       * @param {Object} target
       */
      append: function(target) {
        queue.push(target);
      }
    }
  });

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

    //if ('development' === 'development') {
    //  console.log('==== executed', pool.length, '==== refreshed', Exact.Shadow.refreshed, '====');
    //}

    waiting = false;
    running = false;
    queue.splice(0);
    pool.splice(0); //pool.length = 0;
    cursor = 0;
    //pool.push.apply(pool, pool);
  }

  Exact.Updater = Updater;

})();

//######################################################################################################################
// src/base/Accessor.js
//######################################################################################################################
(function() {

  'use strict';

  var ObjectUtil_assign = Exact.ObjectUtil.assign;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

  var canDefineGetterAndSetter = Exact.ObjectUtil.support('accessor');

  var set, save;

  if (canDefineGetterAndSetter) {
    set = function set(key, value) {
      var constructor = this.constructor, set = constructor.set, descriptors = constructor._descriptors_;

      set.call(key in descriptors ? this._props : this, key, value, this[key], this, descriptors);

      return this;
    };

    save = function save(props) {
      var constructor = this.constructor, set = constructor.set, descriptors = constructor._descriptors_;

      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          set.call(key in descriptors ? this._props : this, key, props[key], this[key], this, descriptors);
        }
      }

      return this;
    };
  } else {
    set = function set(key, value) {
      var constructor = this.constructor, set = constructor.set, descriptors = constructor._descriptors_;

      set.call(this, key, value, this[key], this, descriptors);

      return this;
    };

    save = function save(props) {
      var constructor = this.constructor, set = constructor.set, descriptors = constructor._descriptors_;

      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          set.call(this, key, props[key], this[key], this, descriptors);
        }
      }

      return this;
    };
  }

  function makeGetter(key) {
    // TODO: cache
    return function() {
      var _props = this._props;
      return _props.get(key, this, this.constructor._descriptors_);
    }
  }

  function makeSetter(key) {
    // TODO: cache
    return function(val) {
      var _props = this._props;
      _props.set(key, val, _props[key], this, this.constructor._descriptors_);
    }
  }

  var descriptorShared = {
    enumerable: true,
    configurable: true
  };

  function applyDescriptors(prototype, constructor, descriptors) {
    var desc, keys, key, n = 0;

    if (Array.isArray(descriptors)) { // like ['title', 'name', {price: {type: 'number'}}]
      keys = descriptors;//.slice(0);
      descriptors = null;
      n = keys.length;
      if (typeof keys[n - 1] === 'object') {
        descriptors = keys[n - 1];
        --n;
      }
    }
    //descriptors = descriptors || {};
    descriptors = ObjectUtil_assign({}, descriptors);

    while (--n >= 0) {
      key = keys[n];
      if (key && !(key in descriptors)) {
        descriptors[key] = undefined; // must be undefined
      }
    }

    //var opts = descriptorShared;
    for (key in descriptors) {
      if (!descriptors.hasOwnProperty(key)/* || !descriptors[key]*/) { continue; }

      desc = descriptors[key];

      desc = typeof desc === 'object' ? desc : {type: desc};

      if (canDefineGetterAndSetter) {
        //var opts = {
        //  enumerable: /*'enumerable' in desc ? desc.enumerable :*/ true,
        //  configurable: /*'configurable' in desc ? desc.configurable :*/ true
        //};

        descriptorShared.get = makeGetter(key);
        descriptorShared.set = makeSetter(key);

        ObjectUtil_defineProp(prototype, key, descriptorShared);
      }

      descriptors[key] = desc;
    }

    ObjectUtil_defineProp(constructor, '_descriptors_', {value: descriptors});
    //return descriptors;
  }

  function Accessor(props) {
    throw new Error('Accessor is abstract class and can not be instantiated');
  }

  Exact.defineClass({

    constructor: Accessor,

    statics: {

      get: function(key, accessor, descriptors) {
        var get = /*descriptors &&*/ descriptors[key] && descriptors[key].get;

        if (get) {
          return get.call(accessor, this);
        } else {
          return this[key];
        }
      },

      set: function(key, val, old, accessor, descriptors) {
        //if (val !== old) {
        //  this[key] = val;
        //  return true;
        //}

        if (val !== old) {
          var set = /*descriptors &&*/ descriptors[key] && descriptors[key].set;

          if (set) {
            set.call(accessor, val, this);
          } else {
            this[key] = val;
          }

          //return true;
        }



        return this[key] !== old;
      },

      initialize: function initialize(accessor, props) {
        var constructor = accessor.constructor, descriptors = constructor.descriptors, prototype = constructor.prototype;

        if (accessor._props === undefined) {
          var _props = {};
          ObjectUtil_defineProp(accessor, '_props', {value: _props});
          ObjectUtil_defineProp(_props, 'get', {value: Accessor.get});
          ObjectUtil_defineProp(_props, 'set', {value: constructor.set});
        }

        if (!constructor._descriptors_ /*&& Array.isArray(descriptors)*/) {
          applyDescriptors(prototype, constructor, descriptors);
        }

        if (typeof accessor.defaults === 'function') {
          var defaults = accessor.defaults();
        }

        accessor.save(ObjectUtil_assign({}, defaults, props));
      }
    },

    save: save,

    set: set
  });

  Exact.Accessor = Accessor;

})();

//######################################################################################################################
// src/base/Validator.js
//######################################################################################################################
(function() {

  'use strict';

  //var TYPE_REGEXPS = {
  //  number: /\bnumber\b/,
  //  string: /\bstring\b/,
  //  boolean: /\bboolean\b/
  //};

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
      //if (typeof expectedTypes[i] === 'function') {
      //  str += expectedTypes[i].name;
      //} else {
      //  str += expectedTypes[i].name;
      //}
      types.push('`' + (expectedTypes[i].name || expectedTypes[i]) + '`');
    }

    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be ' + types.join(' or ') + (actualType ? ', not `' + actualType : '') + '`');
  }

  /**
   * Validate the type of the value when the key is set in accessor.
   *
   * @param {Accessor} accessor
   * @param {string} key
   * @param {*} value
   * @param {string|Function} type
   * @returns {TypeError}
   */
  function validateType(accessor, key, value, type) {
    if (value === undefined) { return; } //TODO: required ?

    var t1 = typeof type, t2, error, constructor;

    //t2 = typeof value;
    if (t1 === 'string' && typeof value !== type) { //TODO: type can be array
//    if (t1 === 'string' && !TYPE_REGEXPS[t2].test(type)) {
      t1 = type;
      error = true;
    } else if (t1 === 'function' && !(value instanceof type)) {
      t1 = type.fullName || type.name;
      error = true;
    }

    if (error) {
      constructor = accessor.constructor;
      return makeTypeError(constructor.fullName || constructor.name, key, t1, getType(value));
    } else if (Array.isArray(type)) {
      for (var i = 0, n = type.length; i < n; ++i) {
        t1 = typeof type[i];
        if ((t1 === 'string' && typeof value === type[i]) || (t1 === 'function' && value instanceof type[i])) {
          break;
        }
      }

      if (i === n) {
        constructor = accessor.constructor;
        return makeTypesError(constructor.fullName || constructor.name, key, type, getType(value));
      }
    }
  }

  function validatePattern(accessor, key, value, pattern) {
    if (!pattern.test(value)) {
      return new Error(value, 'does not match the pattern ' + pattern.toString());
    }
  }

  /**
   * Validator provides the `validate()` method.
   *
   * @example A constructor has descriptors:
   *
   *  { name: 'string', role: Student, age: {type: 'number', validator: validateRange} }
   *
   * The validator can check if the type of `name` is 'string', `role` is an instance of Student, and `age` is number
   * in the legal range.
   *
   * @static
   * @constructor
   */
  function Validator() {
    throw new Error('Validator is static class');
  }

  Exact.defineClass({

    constructor: Validator,

    statics: {
      /**
       * Validate the value when the key is set in accessor.
       *
       * @param {Accessor} accessor
       * @param {string} key
       * @param {*} value
       * @param {Object} descriptors
       * @returns {boolean}
       */
      validate: function validate(accessor, key, value, descriptors) {
        var error, validator, pattern, type, desc, validated;//, descriptors = constructor._descriptors_;

        if (descriptors && descriptors.hasOwnProperty(key)) {
          desc = descriptors[key]; //TODO: descriptions[key]

          if (!desc) { return true; }

          type = desc.type;
          //pattern = desc.pattern;
          //required = desc.required;
          validator = desc.validator;

          if (/*!error && */type) {
            validated = true;
            error = validateType(accessor, key, value, type);
          }

          //if (!error && pattern) {
          //  validated = true;
          //  error = validatePattern(accessor, key, value, pattern);
          //}

          if (!error && validator) {
            validated = true;
            if (typeof validator === 'function') {
              error = validator.call(accessor, value, key);
            } else {
              error = validatePattern(accessor, key, value, validator);
            }
          }

          if (validated && /*accessor.on &&*/ accessor.send) {
            accessor.send('validated.' + key, error);
          }

          if (error) {
            if ('development' === 'development') {
              console.warn('Invalid:', error.message);
            }
            return false;
          }
        }

        return true;
      }
    }
  });

  Exact.Validator = Validator;

})();

//######################################################################################################################
// src/base/DirtyMarker.js
//######################################################################################################################
(function() {

  'use strict';

  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

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

          ObjectUtil_defineProp(object, '_dirty', {
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
          delete object._dirty;
        } else {
          delete object._dirty[key];
        }
      }/*,

      hasDirty: function hasDirty(object, key) { // hasDirtyAttr, hasDirty
        var _dirty = object._dirty;
        return _dirty ? (key === undefined || _dirty.hasOwnProperty(key)) : false;
      }*/
    },

    /**
     * Find if some prop is dirty.
     *
     * @param {string} key
     * @returns {boolean}
     */
    hasDirty: function hasDirty(key) {
      var _dirty = this._dirty;
      return _dirty ? (key === undefined || _dirty.hasOwnProperty(key)) : false;
    }
  });

  Exact.DirtyMarker = DirtyMarker;

})();

//######################################################################################################################
// src/core/models/Cache.js
//######################################################################################################################
(function() {
  'use strict';

  var Accessor = Exact.Accessor;
  var DirtyMarker = Exact.DirtyMarker;

  var Accessor_set = Accessor.set;
  var DirtyMarker_check = DirtyMarker.check;
  var DirtyMarker_clean = DirtyMarker.clean;

  /**
   *
   * @constructor
   */
  function Cache(props) { //
    Accessor.initialize(this, props);
  }

  Exact.defineClass({

    constructor: Cache,

    mixins: [Accessor.prototype, DirtyMarker.prototype],

    statics: {

      set: function set(key, val, old, cache, descriptors) {
        var changed = Accessor_set.call(this, key, val, old, cache, descriptors);

        if (changed) {
          DirtyMarker_check(cache, key, this[key], old);

          if (cache.onChange) {
            cache.onChange();
          }
        }

        return changed;
      },

      clean: DirtyMarker_clean
    }
  });

  Exact.Cache = Cache;

})();

//######################################################################################################################
// src/core/models/Store.js
//######################################################################################################################
(function() {

  'use strict';

  var Watcher = Exact.Watcher;
  var Accessor = Exact.Accessor;
  var Validator = Exact.Validator;

  var Accessor_set = Accessor.set;
  var Validator_validate = Validator.validate;

  function Store(props) {
    Accessor.initialize(this, props);
  }

  Exact.defineClass({
    constructor: Store,

    //extend: Accessor,

    mixins: [Watcher.prototype, Accessor.prototype],

    statics: {
      /**
       * Set the prop of the store by given key.
       *
       * @returns {boolean}
       */
      set: function set(key, val, old, store, descriptors) {

        if (!Validator_validate(store, key, val, descriptors)) { return false; }

        var changed = Accessor_set.call(this, key, val, old, store, descriptors);

        if (changed) {
          store.send('changed.' + key);
        }

        return changed;
      },

      from: function from(props) {
        return new Store(props);
      }
    }
  });

  Exact.Store = Store;

})();

//######################################################################################################################
// src/core/models/Collection.js
//######################################################################################################################
(function() {

  'use strict';

  var Watcher = Exact.Watcher;

  /**
   *
   * @constructor
   * @internal
   */
  function Collection() {//TODO: changed.length
    this.push.apply(this, arguments);
  }

  var base = Array.prototype;

  function invalidate(collection, key) {
    collection.isInvalidated = true;
    collection.send(key ? 'changed.' + key : 'changed'); //collection.send(key ? 'change.' + key : 'change);

    if (collection.onChange) { // TODO: remove
      collection.onChange();
    }
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

      return this;
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

      return this;

    },

    insert: function(item, before) { //TODO: before can be number index
      if (!(item instanceof Object) || (arguments.length > 1 && !(before instanceof Object))) {
        throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      }

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

      if (before) {
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

      return this;
    },

    remove: function(item) { //TODO: can be number index
      if (!(item instanceof Object)) {
        throw new TypeError("Failed to execute `remove` on `Collection`: the item to be removed must be object.");
      }

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

      return this;
    },

    replace: function(item, existed) {
      if (!(item instanceof Object) || !(existed instanceof Object)) {
        throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      }

      if (item === existed) { return this; }

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

      return this;
    }
  });

  Exact.Collection = Collection;

})();

//######################################################################################################################
// src/core/shadows/Shadow.js
//######################################################################################################################
(function() {
  'use strict';

  var Skin = Exact.Skin;

  var Cache = Exact.Cache;
  var Collection = Exact.Collection;

  var Updater = Exact.Updater;
  var Accessor = Exact.Accessor;
  var DirtyMarker = Exact.DirtyMarker;

  var setImmediate = Exact.setImmediate;

  var ObjectUtil = Exact.ObjectUtil;

  var Accessor_set = Accessor.set;
  var DirtyMarker_check = DirtyMarker.check;
  var DirtyMarker_clean = DirtyMarker.clean;

  var ObjectUtil_assign = ObjectUtil.assign;
  var ObjectUtil_defineProp = ObjectUtil.defineProp;

  var uid = 0;//Number.MIN_VALUE;

  function createCache(shadow) {
    var cache = new Cache();

    cache.onChange = shadow.invalidate;

    return cache;
  }

  function createCollection(shadow) {
    var collection = new Collection();

    collection.onChange = shadow.invalidate;
    //TODO: collection.on('change', shadow.invalidate);

    return collection;
  }

  /**
   * props getter
   *
   * @returns {Cache}
   */
  function getAttrs() {
    if (!this._attrs) {
      ObjectUtil_defineProp(this, '_attrs', {value: createCache(this), configurable: true});
    }
    return this._attrs;
  }

  /**
   * style getter
   *
   * @returns {Cache}
   */
  function getStyle() {
    if (!this._style && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_style', {value: createCache(this), configurable: true});
    }
    return this._style;
  }

  /**
   * classes getter
   *
   * @returns {Cache}
   */
  function getClasses() {
    if (!this._classes && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_classes', {value: createCache(this), configurable: true});
    }
    return this._classes;
  }

  /**
   * children getter
   *
   * @returns {Collection}
   */
  function getChildren() {
    if (!this._children && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_children', {value: createCollection(this), configurable: true});
    }
    return this._children;
  }

  /**
   * children getter
   *
   * @returns {Collection}
   */
  function getContents() {
    if (!this._contents && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_contents', {value: createCollection(this), configurable: true});
    }
    return this._contents;
  }

  var defineMembersOf;

  if (ObjectUtil.support('accessor')) {
    // lazy mode when getter is supported
    defineMembersOf = function(shadow) {
      ObjectUtil_defineProp(shadow, 'attrs', {get: getAttrs});
      ObjectUtil_defineProp(shadow, 'style', {get: getStyle});
      ObjectUtil_defineProp(shadow, 'classes', {get: getClasses});
      ObjectUtil_defineProp(shadow, 'children', {get: getChildren});
      //ObjectUtil_defineProp(shadow, 'contents', {get: getContents});//TODO: set('contents', []) if fine
    }

  } else {
    // immediate mode when getter is not supported
    defineMembersOf = function(shadow) {
      ObjectUtil_defineProp(shadow, 'attrs', {value: createCache(shadow)});
      ObjectUtil_defineProp(shadow, 'style', {value: createCache(shadow)});
      ObjectUtil_defineProp(shadow, 'classes', {value: createCache(shadow)});
      ObjectUtil_defineProp(shadow, 'children', {value: createCollection(shadow)});
      //ObjectUtil_defineProp(shadow, 'contents', {value: createCollection(shadow)});

      shadow._attrs = shadow.attrs;
      shadow._style = shadow.style;
      shadow._classes = shadow.classes;
      shadow._children = shadow.children;
      shadow._contents = shadow.contents;
    }
  }

  function extract(children) {
    var i, n, $skin, child, $children;

    n = children.length;

    $children = [];

    for (i = 0; i < n; ++i) {
      child = children[i];
      $skin = child.$skin;

      if (/*(child instanceof Shadow) && */!child.excluded && $skin) {
        $children.push($skin);
      }
    }

    return $children;
  }


  /**
   *
   * @constructor
   */
  function Shadow() {
    throw new Error('');
  }

  Exact.defineClass({
    constructor: Shadow,

    mixins: [Accessor.prototype, DirtyMarker.prototype],

    /**
     * Make this shadow invalid and register it to the batchUpdater.
     *
     * @returns {self}
     */
    invalidate: function invalidate(key, val, old) { //TODO: as static method, maybe

      if (!this.isInvalidated /*&& this.isDirty()*/) {
        //console.log('invalidate', this.toString());
        this.isInvalidated = true;
        Updater.insert(this);
      }

      //return this;
    },

    update: function update() { //TODO: enumerable = false
      if (!this.isInvalidated) { return; } // TODO: _secrets, is.invalid, is.refreshed,

      //console.log('update', this.toString());

      if (this.refresh) {
        this.refresh();
      } //TODO: shouldRefresh()�� last chance to update shadow and its children

      Updater.append(this);
      //Shadow.render(this);
      //Shadow.clean(this);

      //if (this.send) {
      //  //shadow.send('refresh');//TODO: beforeRefresh, refreshing
      //  this.send('refreshed');//TODO: beforeRefresh, refreshing
      //}
    },

    render: function render() {
      if (!this.isInvalidated) { return; }

      var $skin = this.$skin,
        props = this, // <--
        attrs = this._attrs,
        style = this._style,
        classes = this._classes,
        children = this._children,
        dirty = null;

      if (props && props._dirty) {
        dirty = props._dirty;
        //Shadow.clean(props);
        if ('excluded' in dirty) {
          var parent = Shadow.getParent(this);
          parent.children.invalidated = true;
          parent.invalidate();
          delete dirty.excluded;
        } // TODO: support more directives

        Skin.renderProps($skin, props, dirty, this._secrets.final);
      }

      Shadow.clean(this);

      if (Skin.isElement($skin)) {
        if (attrs && attrs._dirty) {
          dirty = attrs._dirty;
          Cache.clean(attrs);

          Skin.renderAttrs($skin, attrs, dirty);
        }

        if (style && style._dirty) {
          dirty = style._dirty;
          Cache.clean(style);

          Skin.renderStyle($skin, style, dirty);
        }

        if (classes && classes._dirty) {
          dirty = classes._dirty;
          Cache.clean(classes);

          Skin.renderClasses($skin, classes, dirty);
        }

        if (children && children.isInvalidated) {
          Collection.clean(children);

          var $removed = Skin.renderChildren($skin, extract(children));

          if ($removed && $removed.length > 0) {
            for (var i = 0, n = $removed.length; i < n; ++i) {
              var $parent = Skin.getParent($removed[i]);
              var shadow = Shadow.getShadow($removed[i]);
              if (!$parent && !shadow.hasOwnProperty('excluded')) {
                Shadow.release(shadow);
              }
            }
          }
          // TODO: It is a little hard for IE 8
        }
      }
    },

    //TODO: debug
    toString: function toString() {
      var constructor = this.constructor;

      var tag = Skin.getProp(this.$skin, 'tagName');

      return (constructor.fullName || constructor.name) + '<' + (tag ? tag.toLowerCase() : '') + '>('+this.guid+')';
    },

    blur: function blur() { //TODO: remove
      var $skin = this.$skin;
      setImmediate(function() {
        Skin.call($skin, 'blur');
      });
    },

    focus: function focus() { //TODO: remove
      var $skin = this.$skin;
      setImmediate(function() {
        Skin.call($skin, 'focus');
      });
    },

    statics: {

      set: function set(key, val, old, shadow, descriptors) { // TODO: params
        var changed = Accessor_set.call(this, key, val, old, shadow, descriptors);

        if (changed) {
          DirtyMarker_check(shadow, key, this[key], old);

          shadow.invalidate(key, this[key], old);//TODO:
        }
 
        return changed;
      },


      /**
       * @param {Shadow} shadow
       * @param {Object} props
       * * @param {string} tag
       * @param {string} ns
       */
      initialize: function initialize(shadow, props, tag, ns) {
//        throw new Error('initialize() must be implemented by subclass!');
        shadow.guid = ++uid;
        shadow._secrets = {}; //TODO:
        shadow.update = shadow.update.bind(shadow); //TODO: defineProp
        shadow.render = shadow.render.bind(shadow); //TODO: defineProp
        shadow.invalidate = shadow.invalidate.bind(shadow);
        //shadow._update = Shadow.update.bind(null, shadow);

        Shadow.initSkin(shadow, tag, ns);

        if (Skin.isElement(shadow.$skin)) {
          defineMembersOf(shadow);
        }

        Accessor.initialize(shadow, props);
      },

      /**
       * Create $skin for the shadow.
       *
       * @param {Shadow} shadow
       * @param {string} tag
       * @param {string} ns ''/'svg'/'math'
       */
      initSkin: function initSkin(shadow, tag, ns) {
        ObjectUtil_defineProp(shadow, '$skin', {value: tag/* !== 'TEXT'*/ ? Skin.createElement(tag, ns) : Skin.createText('')}); //TODO: $shin._secrets = {$skin: ...}
//        shadow.$skin._shadow = shadow; //TODO: strict
        if (Skin.canExtend(shadow.$skin)) {
          ObjectUtil_defineProp(shadow.$skin, '_shadow', {value: shadow});
        }
      },

      clean: function clean(shadow) {
        shadow.isInvalidated = false;
        DirtyMarker_clean(shadow); //delete shadow._dirty;
      },

      /**
       * @param {Shadow} shadow
       */
      release: function release(shadow) {
        var releaseImpl = shadow.constructor.release;
        if (releaseImpl) {
          releaseImpl(shadow);
        }

        if (shadow.release) {
          shadow.release();
        }
      }, //TODO: when and how to destroy?

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
       * Find the part matching the CSS selector
       *
       * @param {Shadow} shadow
       * @param {string} selector
       * @returns {Shadow}
       */
      findShadow: function findShadow(shadow, selector) { //TODO: helper, findShadow
        if (Skin.isElement(shadow.$skin)) {
          return Shadow.getShadow(Skin.query(shadow.$skin, selector));
        }
      },

      /**
       * Find all the parts matching the CSS selector
       *
       * @param {Shadow} shadow
       * @param {string} selector
       * @returns {Array}
       */
      findShadows: function findShadows(shadow, selector) { //TODO: helper, findShadows
        if (Skin.isElement(shadow.$skin)) {
          var i, n, parts = [], $nodes = Skin.queryAll(shadow.$skin, selector);

          for (i = 0, n = $nodes.length; i < n; ++i) {
            parts.push(Shadow.getShadow($nodes[i]));
          }

          return parts;
        }
      },

      /**
       * Get the parent shadow of the shadow
       *
       * @param {Shadow} shadow
       * @returns {Shadow}
       */
      getParentShadow: function getParentShadow(shadow) { //TODO: helper
        return Shadow.getShadow(Skin.getParent(shadow.$skin));
      },


      addEventListenerFor: function (shadow, type, useCapture) {
        var $skin = shadow.$skin;
        if (!$skin) { return; }

        var action = shadow._actions[type];

        if (Skin.mayDispatchEvent($skin, type)) {//TODO: No problem?
          action.listener = function (event) {
            shadow.send(Skin.getFixedEvent(event)); // TODO: Shadow.getShadow(domEvent.currentTarget).send()
          };

          Skin.addEventListener($skin, type, action.listener, useCapture);
        } else {
          action.listener = null;
        }
      },

      removeEventListenerFor: function (shadow, type, useCapture) {
        var $skin = shadow.$skin;
        if (!$skin) { return; }

        var action = shadow._actions[type];

        if (action.listener && Skin.mayDispatchEvent($skin, type)) {
          Skin.removeEventListener($skin, type, action.listener, useCapture);

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
  'use strict';

  var Shadow = Exact.Shadow;
  //var hasDirty = Exact.DirtyMarker.hasDirty;

  function Text(data) {
    Text.initialize(this, data);
  }

  Exact.defineClass({
    constructor: Text,

    extend: Shadow,

    statics: {

      create: function(data) {
        var text = new Text();
        text.set('data', data);//TODO: nodeValue, content

        return text;
      },

      release: function release(text) {
        Shadow.clean(text);
      },

      initialize: function(text, data) {
        Shadow.initialize(text, {data: data}, '');
      }
    },

    toString: function() {
      return '"' + this.data + '"(' + this.guid +')'; //TODO: content
    }

  });

  Exact.Text = Text;

})();

//######################################################################################################################
// src/core/shadows/Element.js
//######################################################################################################################
(function () {
  'use strict';

  var Shadow = Exact.Shadow;
  var Watcher = Exact.Watcher;


  function Element(props, tag, ns) {
    Element.initialize(this, props, tag, ns);
  }

  Exact.defineClass({
    constructor: Element,

    extend: Shadow,

    mixins: [Watcher.prototype],

    statics: {
      fullName: 'Element',
      /**
       * Destroy the element. Remove event listeners, and //TODO:
       *
       * @param {Element} element
       */
      release: function release(element) {
        element.off();
        Shadow.clean(element);
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
        if (ns && typeof ns === 'object') { // create(tag, props)
          props = ns;
        } // else create(tag) or create(tag, ns) or create(tag, ns, props)

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

  'use strict';

  var Watcher = Exact.Watcher;
  var Updater = Exact.Updater;
  var Validator = Exact.Validator;

  var Text = Exact.Text;
  var Shadow = Exact.Shadow;
  var Element = Exact.Element;

  //var HTMXTemplate = Exact.HTMXTemplate;
  //var ExpressionUtil = Exact.ExpressionUtil;

  var Shadow_set = Shadow.set;
  var Skin_isElement = Exact.Skin.isElement;
  var Validator_validate = Validator.validate;

  var base = Shadow.prototype;


  function Component(props) {
    //Register necessary properties for this component.
    this.register();

    //Initialize this component
    Component.initialize(this, props);

    //This component is ready
    this.ready();
  }

  //TODO: bindable = true

  Exact.defineClass({
    constructor: Component,

    extend: Shadow,

    mixins: [Watcher.prototype],

    statics: {
      fullName: 'Component',
      /**
       * Set the prop of the component by given key.
       *
       * @param {Component} component
       * @param {string} key
       * @param {*} val
       * @param {*} old
       * @param {Object} descriptors
       * @returns {boolean}
       */
      set: function set(key, val, old, component, descriptors) { // TODO: params
        if (!Validator_validate(component, key, val, descriptors)) { return false; }

        return Shadow_set.call(this, key, val, old, component, descriptors);
      },

      /**
       * Factory method for creating a component
       *
       * @param {Function} ClassRef
       * @param {Object} props
       * @returns {Component}
       */
      create: function create(ClassRef, props) { // TODO: build
        return new ClassRef(props);
      },

      /**
       * Release the component and its children
       *
       * @param {Component} component
       */
      release: function release(component) {
        var i, children = component._children;
        if (children) {
          for (i = children.length - 1; i >= 0; --i) {
            Shadow.release(children[i]);
          }
        }

        var binding, _bindings = component._bindings; //
        if (_bindings) {
          for (i = _bindings.length - 1; i >= 0; --i) {
            binding = _bindings[i];
            binding.constructor.clean(binding); // TODO: Binding.clean()
          }
        }

        component.off();
        Shadow.clean(component);
      },

      /**
       * Initialize this element and its parts, and initParams.
       *
       * @param {Component} component
       * @param {Object} props
       */
      initialize: function initialize(component, props) {
        var HTMXTemplate = Exact.HTMXTemplate;

        var constructor = component.constructor, template = constructor.template, $template;

        if (!template) {
          $template = constructor.$template;

          if ($template && (typeof $template === 'string' || Skin_isElement($template))) {
            template = HTMXTemplate.parse(constructor.$template, constructor.resources);
          } else if (!($template instanceof  HTMXTemplate)) {
            template = HTMXTemplate.parse('<div></div>', constructor.resources);
          } else {
            template = $template;
          }

          constructor.template = template;
        } else if (!(template instanceof HTMXTemplate)) {
          throw new TypeError('The template must be instance of Exact.HTMXTemplate');
        }

        //TODO: check component.render()

        //props.tag = template.tag;

        Shadow.initialize(component, props, template.tag, template.ns);

        HTMXTemplate.compile(template, component);

        component._secrets.final = true;
        component.send('initialized');
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

    update: function update() { //TODO: enumerable = false
      base.update.call(this);

      if (this.isInvalidated) {
        this.send('refreshed');//TODO: beforeRefresh, refreshing
      }
    },

    /**
     * @abstract
     */
    refresh: function refresh() {},

    /**
     * @abstract
     */
    release: function release() {},

    invalidate: function(key, val, old) {
      base.invalidate.call(this, key, val, old);
      //var isInvalidated = this.isInvalidated;
      //
      //if (!isInvalidated /*&& this.isDirty()*/) {
      //  this.isInvalidated = true;
      //  console.log('invalidate', this.toString());
      //}

      if (key) {
        this.send('changed.' + key, val, old);
      }

      //if (!isInvalidated) {
      //  Updater.add(this);
      //}
    }

  });

  Exact.Component = Component;

})();

//######################################################################################################################
// src/core/shadows/List.js
//######################################################################################################################
(function() {
  'use strict';

  var Component = Exact.Component;

  function checkAdapterOf(list) {
    var itemAdapter = list.itemAdapter, itemTemplate = list.itemTemplate;

    if (!itemAdapter) {
      if (itemTemplate) {
        itemAdapter = Exact.defineClass({
          extend: Component,
          statics: {
            //resources: {},
            template: list.itemTemplate//this.contents[0].$skin
          }
        });

        list.itemAdapter = itemAdapter;
      } /*else {
        itemAdapter = Exact.defineClass({
          extend: Component,
          statics: {
            resources: {},
            //$template: "`item`"
            $template: '<span>`${$.item}`</span>'
          }
        });
      }*/

      //list.itemAdapter = itemAdapter;
    }

  }

  function List() {
    Component.call(this, arguments);
  }

  Exact.defineClass({
    constructor: List, extend: Component,

    statics: {
      fullName: 'List',
      //resources: {},
      $template: '<ul></ul>'
    },

    register: function() {
      //this.refresh = this.refresh.bind(this);
    },

    ready: function() {
      //this.on('change.items', this.invalidate);
      //this.once('changed.itemAdapter', function() {
      //  console.log('change.itemAdapter');
      //});
      //this.on('refresh', this.refresh.bind(this));
    },

    refresh: function() {
      var i, n, m, item, items = this.items, itemAdapter, child, children = this.children, contents = [], removed = [];

      if (!items) { return; }

      n = items.length;
      m = children.length;

      checkAdapterOf(this);

      itemAdapter = this.itemAdapter;

      if (!itemAdapter) {return;}

      for (i = 0; i < n; ++i) {
        item = items[i];
        item._fromIndex = -1;
      }

      for (i = 0; i < m; ++i) {
        item = children[i].item;
        if ('_fromIndex' in item) {
          item._fromIndex = i;
        } else {
          removed.push(children[i]);
        }
      }

      for (i = 0; i < n; ++i) {
        item = items[i];

        if (item._fromIndex >= 0 ) {
          child = children[item._fromIndex];
          contents.push(child);
        } else {
          var content = new itemAdapter({item: item});
          contents.push(content);
          this.send('itemAdded', item, content);
        }

        delete item._fromIndex;
      }

      for (i = 0; i < n; ++i) {
        if (i < m) {
          children.set(i, contents[i]);
        } else {
          children.push(contents[i]);
        }
      }

      if (m > n) {
        children.splice(n);
        n = removed.length;
        if (n) {
          for (i = 0; i < n; ++i) {
            content = removed[i];
            item = content.item;
            delete item._fromIndex;
            this.send('itemRemoved', item, content);
          }
        }
      }

    }
  });

  Exact.List = List;

  Exact.RES.register('List', List);

})();

//######################################################################################################################
// src/core/bindings/Binding.js
//######################################################################################################################
(function() {

  'use strict';

  var RES = Exact.RES;
  var EvaluatorUtil = Exact.EvaluatorUtil;
  var applyEvaluator = EvaluatorUtil.applyEvaluator;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

  function Binding(scope, target, options) {
    this.scope = scope;
    this.target = target;

    this.mode = options.mode;
    //this.life = options.life;

    this.source = options.source;
    this.evaluator = options.evaluator;
    //this.assign = options.assign || assign;
    this.targetProp = options.targetProp;
    this.sourceProp = options.sourceProp;
    this.scopePaths = options.scopePaths;
    this.scopeEvent = options.scopeEvent;
    //this.targetEvent = options.targetEvent;
    this.converters = options.converters;

    this.exec = this.exec.bind(this);
  }

  Exact.defineClass({
    constructor: Binding,

    statics: {

      build: function(target, prop, scope, options) {
        var mode = options.mode,
          scopePaths = options.scopePaths, scopeEvent = options.scopeEvent,
          converters = options.converters, evaluator = options.evaluator;
        // TODO:unique scopePaths
        if (mode === 2) {
          var i, source, sourceProp, path = scopePaths[0];

          i = path.lastIndexOf('.');

          if (i < 0) {
            source = scope;
            sourceProp = path;
          } else {
            source = RES.search(path.slice(0, i), scope, true);
            sourceProp = path.slice(i+1);
          }
        }

        var binding = new Binding(scope, target, {
          mode: mode,
          //life: life,
          source: source,
          evaluator: evaluator,

          targetProp: prop,
          sourceProp: sourceProp,
          scopePaths: scopeEvent ? null : scopePaths,
          scopeEvent: scopeEvent,
          converters: converters
          //targetEvent: targetEvent
        });

        binding.exec({dispatcher: source});

        if (mode < 1) {
          eye('once', scopePaths, binding.scope, binding.target, binding);
        } else {
          eye('on', scopePaths, binding.scope, binding.target, binding);
        }

        if (mode === 2) {
          eye('on', [prop], target, source, binding);
        }

        return binding;
      },

      clean: function(binding) {
        if (binding.mode <= 0) { return; }

        eye('off', binding.scopePaths, binding.scope, binding.target, binding);

        if (binding.mode === 2)  {
          eye('off', [binding.targetProp], binding.target, binding.source, binding);
        }
      }
    },

    exec: function(event) {
      var value,
        scope = this.scope,
        //assign = this.assign,
        evaluator = this.evaluator,
        converters = this.converters,
        source = this.source, target = this.target,
        sourceProp = this.sourceProp, targetProp = this.targetProp;

      if (this.mode !== 2) {
        value = applyEvaluator(evaluator, 'exec', scope, event);
        if (converters) {
          value = applyConverters(converters, 'exec', scope, event, value);
        }
        assign(target, targetProp, value);
      } else if (event.dispatcher !== target) {
        value = source[sourceProp];
        if (converters) {
          value = applyConverters(converters, 'exec', scope, event, value);
        }
        assign(target, targetProp, value);
      } else {
        value = target[targetProp];
        if (converters) {
          value = applyConverters(converters, 'back', scope, event, value);
        }
        assign(source, sourceProp, value);
      }

      if (this.mode === 0) {
        Binding.clean(this);
      }
    }
  });

  function applyConverters(converters, name, scope, event, value) {
    var i, begin, end, step, evaluator;//, exec, rest, args;

    if (!converters.length) { return value; }

    if (name === 'exec') {
      //name = 'exec';
      begin = 0;
      step = +1;
      end = converters.length;
    } else {
      //name = 'back';
      begin = converters.length - 1;
      step = -1;
      end = -1;
    }

    for (i = begin; i !== end; i += step) {
      evaluator = converters[i];
      value = applyEvaluator(evaluator, name, scope, event, value);
    }

    return value;
  }

  function assign(target, key, val) {
    if (target.set) {
      target.set(key, val);
    } else {
      target[key] = val;
    }
  }

  function dep(i, prop, paths, scope) {
    var descriptors = scope.constructor._descriptors_;
    var desc = descriptors[prop];

    if (desc && desc.depends) {
      paths.push.apply(paths, desc.depends);
      paths[i] = null;
      return true;
    }
  }

  function eye(method, paths, scope, target, binding) {
    var flag, event = binding.scopeEvent;

    if (event && scope === binding.scope) {
      if (scope[method]) {
        scope[method](event, binding.exec);
        flag = true;
      }
    } else if (paths && paths.length > 0) {
      var i, j, path, prop, source, cache = {};

      for (i = 0; i < paths.length; ++i) {
        path = paths[i];

        if (!path || cache[path]) {
          paths[i] = null;
          continue;
        }

        cache[path] = true;

        j = path.lastIndexOf('.');

        if (j < 0) {
          prop = path;
          source = scope;
          if (method === 'on' && dep(i, prop, paths, scope)) {
            continue;
          }
        } else {
          prop = path.slice(j + 1);
          source = RES.search(path.slice(0, j), scope, true);
        }

        if (source && source[method]) {
          source[method]('changed.' + prop, binding.exec);// TODO: binding.invalidate
          flag = true;
        }
      }
    }

    if (flag) {
      if (method === 'on') {
        record(target, binding);
      } else if (method === 'off') {
        remove(target, binding);
      }
    }
  }

  function record(target, binding) {
    var _bindings = target._bindings;

    if (_bindings) {
      _bindings.push(binding);
    } else {
      //target._bindings = [binding];
      ObjectUtil_defineProp(target, '_bindings', {value: [binding]});
    }
  }

  function remove(target, binding) {
    var _bindings = target._bindings;

    _bindings.splice(_bindings.lastIndexOf(binding), 1);
  }

  Exact.Binding = Binding;

})();

//######################################################################################################################
// src/core/templates/BindingTemplate.js
//######################################################################################################################
(function() {

  'use strict';

  var Binding = Exact.Binding;

  function BindingTemplate() {
    this.mode = 0;
    this.evaluator = null; //this.expressions = null;
    this.converters = null;
    this.scopePaths = null;
    this.scopeEvent = null;
  }

  BindingTemplate.compile = function(template, property, target, scope) {
    Binding.build(target, property, scope, template);
  };

  Exact.BindingTemplate = BindingTemplate;

})();

//######################################################################################################################
// src/core/bindings/EventBinding.js
//######################################################################################################################
(function() {

  'use strict';

  function HandlerTemplate() {
    this.exec = null;
    this.name = '';
  }

  HandlerTemplate.compile = function(template, event, target, scope) {
    var exec = template.exec, name = template.name;

    if (!exec) {
      exec = scope[name];
    }

    target.on(event, exec.bind(scope));
  };

  Exact.HandlerTemplate = HandlerTemplate;

})();

//##############################################################################
// src/core/models/TextTemplate.js
//##############################################################################
(function() {
  'use strict';
  
  var Cache = Exact.Cache;
  var DirtyMarker = Exact.DirtyMarker;
  var ExpressionUtil = Exact.ExpressionUtil;

  var Array$join = Array.prototype.join;
  
  
  function Fragment() {
    Cache.apply(this, arguments);
  }
  
  Exact.defineClass({
    constructor: Fragment,
    extend: Cache,
    mixins: [DirtyMarker.prototype],
    toString: function() {
      return Array$join.call(this, '');
    }
  });

  function TextTemplate() {
    this.push.apply(this, arguments);
  }
  
  Exact.defineClass({
    constructor: TextTemplate, extend: Array,
    statics: {
      compile: function(template, property, target, scope) {
        var i, n, expression, fragment = new Fragment(), pieces = template;
        
        for (i = 0, n = pieces.length; i < n; i += 2) {
          fragment[i] = pieces[i];

          expression = pieces[i+1];

          if (expression) {
            ExpressionUtil.applyExpression(expression, scope, fragment, i+1);
          }
        }
        
        if (i === n) {
          fragment[n-1] = pieces[n-1];
        }

        fragment.length = n;

        function exec() {
          if (!fragment.hasDirty()) { return; }

          if (target.set) {
            target.set(property, fragment.toString());
          } else {
            target[property] = fragment.toString();
          }
        }

        exec();

        scope.on(pieces.scopeEvent, exec);

        fragment.onChange = scope.invalidate;
      }
    }
  });

  Exact.TextTemplate = TextTemplate;

})();

//######################################################################################################################
// src/core/templates/StyleTemplate.js
//######################################################################################################################
(function() {

  'use strict';

  var ObjectUtil_assign = Exact.ObjectUtil.assign;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

  function DataTemplate(literals, expressions) {
    ObjectUtil_assign(this, literals);
    ObjectUtil_defineProp(this, 'expressions', {
      value: expressions, writable: true, enumerable: false, configurable: true
    });
  }

  Exact.DataTemplate = DataTemplate;

})();

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

  var DataTemplate = Exact.DataTemplate;

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
    //this.actions = null;  // for refactor
    //this.indices = null;  // for refactor
    //this.directives = null;
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
    
    if (!Array.isArray(params)) {
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
    } else {
      children = params;
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
      //target.set(props);
      target.save(props);
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
        classes = template.classes = new DataTemplate(); //TODO: defineProp
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
        scope._todos.push({target: content, expressions: {data: child}}); // TODO: collectExpressions
      } else if (child instanceof Object) {
        uid = child.uid;
        tag = child.tag;
        type = child.type;
        //literals = child.literals; //TODO:

        if (!type) {
          child.ns = child.ns || template.ns;
          content = Element.create(tag, child.ns);
        } else {
          content = Component.create(type);
        }
        //TODO: collect contents/slots, scope._todos.push({target: content, expressions: {placeholder: {}}});
        initSelfAndChildrenOrContents(scope, content, child);

        if (uid) {
          scope[uid] = content; //TODO: addPart
        }

        if (tag === 'slot' /*&& target !== scope*/) {
          scope._slots[content.name || '*'] = {
            target: target, offset: i, collection: []
          };
        }
      }

      contents.push(content);
    }

    if (!template.type || target === scope) {
      target.children.reset(contents); //TODO: replace, reset
    } else {
      target.set('contents', contents);
      initSlots(target);
    }
  }

  function initSlots(component) {
    var slots = component._slots, contents = component.contents;
    var i, n, name, slot, content, children, collection;

    for (i = 0, n = contents.length; i < n; ++i) {
      content = contents[i];
      name = content.slot || '*';
      slot = slots[name];
      if (slot) {
        collection = slots[name].collection;
        collection.push(content);
      }
    }

    for (name in slots) {
      if (slots.hasOwnProperty(name)) {
        slot = slots[name];
        children = slot.target.children;
        children.splice.apply(children, [slot.offset, 1].concat(slot.collection));
      }
    }

    delete component._slots;
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

    delete component._todos;
  }

  function initSelfAndChildrenOrContents(scope, target, template) {
    initSelf(scope, target, template);
    initChildrenOrContents(scope, target, template);
  }

  function compile(template, component) {
    component._slots = {};
    component._todos = [];

    initSelfAndChildrenOrContents(component, component, template);

    initExpressions(component);

    //delete component._todos;
    //delete component._slots;

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

    //target.set(all);
    target.save(all);
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

        if ('development' === 'development' && key in newIndices) {
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

//######################################################################################################################
// src/htmx/parsers/HandlerParser.js
//######################################################################################################################
(function() {

  'use strict';

  var EvaluatorUtil = Exact.EvaluatorUtil;
  var ExpressionUtil = Exact.ExpressionUtil;

  var HandlerTemplate = Exact.HandlerTemplate;


  function parse(expr) {
    expr = expr.trim();

    var template = new HandlerTemplate();

    //if (/^\$\.[\w\$]+(\.[\w\$]+)*$/.test(expr)) {
    //if (/^\$\.[\w\$]+$/.test(expr)) {
    //  template.name = expr.slice(2);
    //}
    if (/^[\w\$]+$/.test(expr)) {
      template.name = expr;
    } else {
      template.exec = EvaluatorUtil.makeExpressionEvaluator(expr/*, []*/).exec;
    }

    return ExpressionUtil.makeExpression(HandlerTemplate, template);
  }

  Exact.HandlerParser = {
    parse: parse
  };

})();

//######################################################################################################################
// src/htmx/parsers/BindingParser.js
//######################################################################################################################
(function() {
  'use strict';

  var RES = Exact.RES;

  var StringUtil = Exact.StringUtil;
  var LiteralUtil = Exact.LiteralUtil;
  var EvaluatorUtil = Exact.EvaluatorUtil;
  var ExpressionUtil = Exact.ExpressionUtil;

  var BindingTemplate = Exact.BindingTemplate;

  //var ExpressionParser = Exact.ExpressionParser;

  var StringUtil_split = StringUtil.split;
  var StringUtil_range = StringUtil.range;
  var StringUtil_isClosed = StringUtil.isClosed;

  var makeEvaluator = EvaluatorUtil.makeEvaluator;
  var makeGetEvaluator = EvaluatorUtil.makeGetEvaluator;
  var makeNotEvaluator = EvaluatorUtil.makeNotEvaluator;
  var makeExpressionEvaluator = EvaluatorUtil.makeExpressionEvaluator;

  var REGEXP_1 = /^[\w\$]+((\[|\]?\.)[\w\$]+)*$/; //a[0].b.c, path
  var REGEXP_2 = /^!?[\w\$]+((\[|\]?\.)[\w\$]+)*(\(.*\))?$/; //!$.a[0].b.c(), path or func
  var REGEXP_3 = /\$((\[|\]?\.)[\w\$]+)+(?!\()/g; //$.a[0].b.c(), path on scope
  var REGEXP_4 = /^\$((\[|\]?\.)[\w\$]+)+$/; //

  var EVENT_ANYWAY = 'refreshed';

  var BINDING_SYMBOLS = {
    ONE_TIME: '&', ONE_WAY: '@', TWO_WAY: '#'
  };

  var BINDING_BRACKETS = '{}';
  var SCOPE_EVENT_SYMBOL = '*';
  var INLINE_RES_SYMBOL = '_';
  //var THIS_SYMBOL = '$';

  //var BINDING_LIKE_REGEXP = /([&@#]\{)/;
  var BINDING_LIKE_REGEXP = new RegExp(
    '['+ BINDING_SYMBOLS.ONE_TIME + BINDING_SYMBOLS.ONE_WAY + BINDING_SYMBOLS.TWO_WAY +']\\'
    + BINDING_BRACKETS[0]// + '.+\\' + BINDING_BRACKETS[1]
  );

  var SCOPE_EVENT_REGEXP = /\*(\w(\.\w+)?)*[ ]*}$/;

  function parseArgs(args, resources) { //TODO: 1, $.b, red, exec(), $.f()
    var arg, res, flag, flags, parsed;

    flags = args.flags;

    for (var i = 0, n = args.length; i < n; ++i) {
      arg = args[i];

      flag = EvaluatorUtil.ARG_FLAG_LITE; //constant
      parsed = undefined;

      parsed = LiteralUtil.parse(arg);

      if (parsed === undefined) {
        if (REGEXP_1.test(arg)) { //TODO
          flag = EvaluatorUtil.ARG_FLAG_PATH; //path
          parsed = arg.slice(2);
        } else {
          res = RES.search(arg, resources);

          if (res) {
            parsed = res;
          } else {
            flag = EvaluatorUtil.ARG_FLAG_EVAL; //evaluator
            parsed = parseEvaluator(arg, resources);
          }
        }
      }

      args[i] = parsed;

      if (flag) {
        if (!flags) {
          flags = args.flags = [];
        }

        flags[i] = flag;
      }
    }

    return args;
  }

  function parseEvaluator(expr, resources) {
    var i, j, k, l, res, path, args, evaluator;

    if (REGEXP_2.test(expr)) {
      i = expr.indexOf('!');
      j = expr.indexOf('$.');
      l = expr.indexOf('(');

      i = i === 0 ? 1 : 0;
      j = j === i ? 1 : 0;

      k = i + j * 2;

      if (l < 0) { // path, not function
        args = [];
        path = expr.slice(k);

        if (j) {
          res = path;
          args.flags = [EvaluatorUtil.ARG_FLAG_PATH]; //TODO: EvaluatorUtil.setFlag(args, index, EvaluatorUtil.FLAG_PATH)
        } else {
          res = LiteralUtil.parse(path); // TODO:

          if (res === undefined) {
            res = RES.search(path, resources);
          }
        }

        args.push(res);

        evaluator = i ? makeNotEvaluator(args) : makeGetEvaluator(args);
      } else { // function, possible but maybe illegal
      //} else if (StringUtil_isClosed(expr, l, expr.length, '()')) { // function, possible but maybe illegal
        var range = StringUtil_range(expr, l, '', '()');

        if (range && range[1] === expr.length) {
          path = expr.slice(k, l);
          args = StringUtil_split(expr.slice(l + 1, expr.length - 1), ',', '()');

          if (args.length) {
            args = parseArgs(args, resources);
          } else {
            args = null;
          }

          if (path) {
            if (j) {
              evaluator = {
                name: path, args: args
              }
            } else {
              res = RES.search(path, resources);

              if (!res) {
                throw new Error('no such resource');
              } else if (!res.exec) {
                evaluator = makeEvaluator(res, args);
              } else {
                evaluator = makeEvaluator(res.exec, args, res.back);
              }
            }

            if (i) {
              args = [evaluator];
              args.flags = [2]; //TODO: EvaluatorUtil.setFlag(args, index, EvaluatorUtil.FLAG_EVAL)
              evaluator = makeNotEvaluator(args);
            }
          } else { // @{ (1, 2, $.title) } will return $.title
            evaluator = i ? makeNotEvaluator(args) : makeGetEvaluator(args);
          }
        }

      }
    }

    if (!evaluator) {
      // TODO: not efficient
      // args = [];
      // var rest = [];
      //for (var key in resources) {
      //  if (resources.hasOwnProperty(key) && expr.indexOf(key) >= 0) {
      //    rest.push(key);
      //    args.push(resources[key]);
      //  }
      //}

      args = null;
      res = resources[INLINE_RES_SYMBOL];
      if (res && expr.indexOf(INLINE_RES_SYMBOL + '.') >= 0) {
        args = [res];
        var rest = [INLINE_RES_SYMBOL];
      }

      evaluator = makeExpressionEvaluator(expr, args, rest);
    }

    return evaluator;
  }

  function extractScopePaths(expr) {
    var paths = expr.match(REGEXP_3);

    if (paths) {
      for (var i = 0, n= paths.length; i < n; ++i) {
        paths[i] = paths[i].slice(2);
      }
    }

    return paths;
  }

  /**
   *
   * @param {string} expr
   * @param {Object} resources
   * @returns {*}
   */
  function parse(expr, resources) {
    var symbol = expr[0], mode = -1, tail, scopeEvent, i, j;

    switch (symbol) {
      case BINDING_SYMBOLS.ONE_TIME:
        mode = 0;
        break;
      case BINDING_SYMBOLS.ONE_WAY:
        mode = 1;
        break;
      case BINDING_SYMBOLS.TWO_WAY:
        mode = 2;
        break;
    }

    if (mode < 0 || !StringUtil_isClosed(expr, 1, expr.length, BINDING_BRACKETS)) { return null; }

    if (SCOPE_EVENT_REGEXP.test(expr)) {
      i = expr.lastIndexOf(SCOPE_EVENT_SYMBOL);

      tail = expr.slice(i+1, expr.length-1);
      expr = expr.slice(2, i);

      scopeEvent = tail.trim();

      if (!scopeEvent) {
        scopeEvent = EVENT_ANYWAY;// TODO: updated, not here
      }
    } else {
      expr = expr.slice(2, expr.length-1);
    }

    if (/*mode > 0 && */!scopeEvent) {
      var scopePaths = extractScopePaths(expr);// TODO: later
    }

    var piece, pieces = StringUtil_split(expr, '|', '()'),  converters, evaluator, n; //TODO

    piece = pieces[0];
    if (mode < 2) {
      evaluator = parseEvaluator(piece, resources);
    } else if (!REGEXP_4.test(piece)) {
      throw new Error('Illegal two-way binding expression');
    }

    if (pieces.length > 1) {
      converters = [];

      for (i = 1, n = pieces.length; i < n; ++i) {
        piece = pieces[i];
        //if (piece.indexOf('(') < 0) {
        if (piece[piece.length - 1] !== ')') {
          piece += '()';
        }

        converters.push(parseEvaluator(piece, resources));
      }
    }

    var template = new BindingTemplate();

    template.mode = mode;
    template.evaluator = evaluator;
    template.converters = converters;
    template.scopePaths = scopePaths;
    template.scopeEvent = scopeEvent;

    return ExpressionUtil.makeExpression(BindingTemplate, template);
  }

  function like(expr) {
    return BINDING_LIKE_REGEXP.test(expr);
  }

  Exact.BindingParser = {
    BINDING_BRACKETS: BINDING_BRACKETS,
    BINDING_SYMBOLS: BINDING_SYMBOLS,
    EVENT_ANYWAY: EVENT_ANYWAY,
    parse: parse,
    like: like
  }

})();

//######################################################################################################################
// src/htmx/parsers/TextParser.js
//######################################################################################################################
(function() {
  'use strict';

  var TextTemplate = Exact.TextTemplate;
  //var ExpressionParser = Exact.ExpressionParser;
  var BindingParser = Exact.BindingParser;
  var ExpressionUtil = Exact.ExpressionUtil;

  var BINDING_SYMBOLS = BindingParser.BINDING_SYMBOLS;
  var BINDING_BRACKETS = BindingParser.BINDING_BRACKETS;

  var StringUtil_range = Exact.StringUtil.range;

  Exact.TextParser = {
    /**
     * @example
     *    <div title="`The title is &{$.title}`">`${$.a} + ${$.b} = ${$.a + $.b}`</div>
     *
     * @param {string} expr
     * @param {Object} resources
     * @returns {*}
     */
    parse: function(expr, resources) { //TODO:
      var i, j, indices = [0], pieces = [], piece, expression;

      var range0 = StringUtil_range(expr, -1, BINDING_SYMBOLS.ONE_TIME, BINDING_BRACKETS);
      var range1 = StringUtil_range(expr, -1, BINDING_SYMBOLS.ONE_WAY, BINDING_BRACKETS);

      if (!range0 && !range1) { return null; }

      while (range1 || range0) {
        if (range1) {
          if (range0 && range0[0] < range1[0]) {
            i = range0[0];
            j = range0[1];
            range0 = StringUtil_range(expr, j, BINDING_SYMBOLS.ONE_TIME, BINDING_BRACKETS);
          } else {
            i = range1[0];
            j = range1[1];
            range1 = StringUtil_range(expr, j, BINDING_SYMBOLS.ONE_WAY, BINDING_BRACKETS);
          }
        } else {
          if (range1 && range1[0] < range0[0]) {
            i = range1[0];
            j = range1[1];
            range1 = StringUtil_range(expr, j, BINDING_SYMBOLS.ONE_WAY, BINDING_BRACKETS);
          } else {
            i = range0[0];
            j = range0[1];
            range0 = StringUtil_range(expr, j, BINDING_SYMBOLS.ONE_TIME, BINDING_BRACKETS);
          }
        }

        indices.push(i, j);
      }

      indices.push(expr.length);

      for (i = 0, j = indices.length - 1; i < j; ++i) {
        piece = expr.slice(indices[i], indices[i+1]);

        if (i % 2) {
          pieces[i] = BindingParser.parse(piece, resources);
        } else {
          pieces[i] = piece;
        }
      }

      //pieces.mode = 1;
      pieces.scopeEvent = BindingParser.EVENT_ANYWAY;

      return ExpressionUtil.makeExpression(TextTemplate, pieces);
    }
  };

})();

//######################################################################################################################
// src/htmx/parsers/DataParser.js
//######################################################################################################################
(function() {
  'use strict';

  var StringUtil = Exact.StringUtil;
  var LiteralUtil = Exact.LiteralUtil;

  var DataTemplate = Exact.DataTemplate;

  var BindingParser = Exact.BindingParser;
  var TextParser = Exact.TextParser;

  var BINDING_BRACKETS = BindingParser.BINDING_BRACKETS;

  Exact.DataParser = {
    /**
     * @example
     *    <div x-style="color: red; backgroundColor: &{$.bgColor | hex2rgb}; fontSize: `${$.fontSize}px`">
     *      <div x-class="btn: true; active: ${$.a > $.b}"></div>
     *    </div>
     *
     * @param {string} expr
     * @param {Object} resources
     * @param {string} type
     * @returns {StyleXTemplate}
     */
    parse: function(expr, resources, type) {// + target type, target prop
      var i, j, n, key, piece, literals, expressions, expression;

      var pieces = StringUtil.split(expr, ';', BINDING_BRACKETS);

      for (i = 0, n = pieces.length; i < n; ++i) {
        piece = pieces[i];

        j = piece.indexOf(':');
        key = piece.slice(0, j).trim();

        if (!key) {
          throw new Error('key should not be empty');
        }

        expr = piece.slice(j+1).trim();

        expression = BindingParser.parse(expr, resources) || TextParser.parse(expr, resources);

        if (expression) {
          expressions = expressions || {};
          expressions[key] = expression;
        } else {
          literals = literals || {};
          literals[key] = type ? LiteralUtil.parse(expr, type) : expr;
        }
      }

      return new DataTemplate(literals, expressions);
    }
  };

})();

//######################################################################################################################
// src/htmx/parsers/HTMXParser.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;
  var Skin = Exact.Skin;

  var ObjectUtil = Exact.ObjectUtil;
  var LiteralUtil = Exact.LiteralUtil;

  var HTMXTemplate = Exact.HTMXTemplate;

  var DataParser = Exact.DataParser;
  var TextParser = Exact.TextParser;
  var BindingParser = Exact.BindingParser;
  var HandlerParser = Exact.HandlerParser;
  //var ExpressionParser = Exact.ExpressionParser;

  var ObjectUtil_defineProp = ObjectUtil.defineProp;

  var PROP_POSTFIX_CODE = '?'.charCodeAt(0);

  var BLANK_REGEXP = /[\n\r\t]/g;

  var COMMON_TYPES = {
    'number': 'number', 'boolean': 'boolean', 'string': 'string', 'json':'json', 'contents': 'contents'
  };

  var SPECIAL_KEYS  = { //TODO: x-call="insert(1)" => insert(value, 1)
    'x-as': 'as',
    'x-id': 'uid',
    //'x-on': 'actions', //TODO: remove
    'x-type': 'type',
    'x-attrs': 'attrs',
    'x-style': 'style',
    'x-class': 'classes'
  };

  function getProps(node) {
    if (!node.props) {
      node.props = {};
    }

    return node.props;
  }

  function getSpecials($template) {
    var key, x_key, specials = {};

    for (x_key in SPECIAL_KEYS) {
      if (!SPECIAL_KEYS.hasOwnProperty(x_key)) { continue; }

      key = SPECIAL_KEYS[x_key];

      if (Skin.hasAttr($template, x_key)) {
        specials[key] = Skin.getAttr($template, x_key);
        //Skin.removeAttr($template, x_key);
      }
    }

    return specials;
  }

  function getContents($child, resources) {
    var i, n , contents = [], $contents = Skin.getChildrenCopy($child);

    for (i = 0, n = $contents.length; i < n; ++i) {
      contents.push(parse($contents[i], resources));
    }

    return contents;
  }

  function parseSpecials(node, $template, resources) {
    var specials = getSpecials($template);

    if (specials.attrs) {
      ObjectUtil_defineProp(node, 'attrs', {value: DataParser.parse(specials.attrs, resources, '')});
    }

    if (specials.style) {
      ObjectUtil_defineProp(node, 'style', {value: DataParser.parse(specials.style, resources, '')});
    }

    if (specials.classes) {
      ObjectUtil_defineProp(node, 'classes', {value: DataParser.parse(specials.classes, resources, 'boolean')});
    }

    if (specials.as) {
      node.as = specials.as;
    }

    if (specials.uid) {
      node.uid = specials.uid;

      node.attrs = node.attrs || {};
      node.attrs['x-id'] = specials.uid;
    }

    if (specials.type) {
      var type = specials.type;

      if (!(type in COMMON_TYPES)) {
        type = RES.search(type, resources);

        if (!type) {
          throw new TypeError('can not find such type');
        }
      }

      ObjectUtil_defineProp(node, 'type', {value: type}); //TODO: node.type = type, freeze node at last.

      node.attrs = node.attrs || {};
      node.attrs['x-type'] = specials.type;
    }
  }

  function parseEventFromAttr(node, key, expr) {
    var props = getProps(node);

    if (!props.expressions) {
      ObjectUtil_defineProp(props, 'expressions', {value: {}});
    }

    props.expressions[key] = HandlerParser.parse(expr);
  }

  function parsePropFromAttr(node, key, expr, type, resources) {
    var n = key.length- 1, props = getProps(node), literal, expression;

    //if (key[n] === '?') { //TODO: charCodeAt
    if (key.charCodeAt(n) === PROP_POSTFIX_CODE) { //TODO: charCodeAt
      key = key.slice(0, n);
      var like = true;
    }

    if (!expr) {
      literal = true;
    } else if (like || BindingParser.like(expr)) {
      expression = BindingParser.parse(expr, resources) || TextParser.parse(expr, resources);
    }

    if (expression) {
      if (!props.expressions) {
        ObjectUtil_defineProp(props, 'expressions', {value: {}});
      }

      var expressions = props.expressions;

      expressions[key] = expression;
    } else {
      literal = literal || (node.type ? LiteralUtil.parse(expr, type) : undefined);
      props[key] = (literal !== undefined) ? literal : expr;
    }

  }

  function parseSelf(node, $template, resources) {
    node.ns = Skin.getNameSpace($template);
    node.tag = Skin.getProp($template, 'tagName').toLowerCase(); //TODO: toLowerCase

    parseSpecials(node, $template, resources);

    if (!Skin.hasAttrs($template)) { return; }

    var attrs = Skin.getAttrs($template);

    for (var key in attrs) {
      if (attrs.hasOwnProperty(key) && !SPECIAL_KEYS.hasOwnProperty(key)) {
        if (key[key.length-1] !== '+') {
          parsePropFromAttr(node, Skin.toCamelCase(key), attrs[key], '', resources);
        } else {
          parseEventFromAttr(node, Skin.toCamelCase(key.slice(0, key.length-1)), attrs[key]);
        } // TODO: parseDirectiveFromAttr
      }
    }
  }

  function parseChildren(node, $template, resources) {
    //Skin.normalize($template);
    var i, n, key, tag, type, text = '', stay, expression, props,// = node.props,
      $child, $children = Skin.getChildrenCopy($template), child, children = [];

    for (i = 0, n = $children.length; i < n; ++i) {
      $child = $children[i];

      if (Skin.isComment($child)) { continue; }

      if (Skin.isText($child)) { // TODO: normalize text nodes
        text += Skin.getProp($child, 'data');
        continue;
      } else if (text) {
        text = text.replace(BLANK_REGEXP, '').trim();

        if (BindingParser.like(text)) {
          expression = TextParser.parse(text, resources);
        }

        children.push(expression || text);

        expression = null;
        text = '';
      }

      child = new HTMXTemplate();

      parseSelf(child, $child, resources);

      key = child.as;
      tag = child.tag;
      type = child.type;

      if (key) { //TODO:
        if (tag !== 'value') { //TODO: <value x-as="price" x-type="number">123</value>
          props = getProps(node);
          props[key] = child;
        } /*else if (type === 'contents') { //TODO: fistChild is not text
          props = getProps(node);
          props[key] = getContents($child, resources);
        } */else if (!type || type in COMMON_TYPES) {
          text = Skin.getProp($child, 'textContent');
          parsePropFromAttr(node, key, text, type, resources);
          text = '';
        }
      }

      parseChildren(child, $child, resources);

      if (!key) {
        if (tag === 'value') { // TODO: <value>1</value> as a content
          text = Skin.getProp($child, 'textContent');
          child = LiteralUtil.parse(text, type) || text;
        }

        children.push(child);
      }
    }

    if (text) { //TODO: as function
      text = text.replace(BLANK_REGEXP, '').trim();

      if (BindingParser.like(text)) {
        expression = TextParser.parse(text, resources);
      }

      children.push(expression || text);
    }

    node.children = children;
  }

  function parse($template, resources) {
    var host = new HTMXTemplate();

    resources = resources || {};

    if (typeof $template === 'string') {
      $template = Skin.parse($template.trim())[0];
    }

    //if (typeof $template === 'string') {
    //  var $nodes = Skin.parse($template.trim());
    //  for (var i = 0; i < $nodes.length; ++i) {
    //    if (Skin.isElement($nodes[i])) { break; } // TODO: maybe comment
    //  }
    //  $template = $nodes[i];
    //}

    if (!Skin.isElement($template)) { return; }

    parseSelf(host, $template, resources);
    parseChildren(host, $template, resources);

    return host;
  }

  HTMXTemplate.parse = parse;

  Exact.HTMXParser = {
    parse: parse
  };
  
})();

//######################################################################################################################
// src/more/inputs/Input.js
//######################################################################################################################
(function() {

  'use strict';

  var Skin = Exact.Skin;
  var Component = Exact.Component;
  // TODO: add validator to value. min, max, pattern...
  function Input() {
    Component.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Input, extend: Component,

    statics: {
      $template: '<input>'
    },

    register: function() {
      this.trigger = 'change';
      this.onChange = this.onChange.bind(this);
    },

    ready: function() {
      var self = this;

      this.on(this.trigger, this.onChange);

      this.on('changed.trigger', function(evt, val, old) {
        self.off(old, self.onChange);
        self.on(val, self.onChange);
      });
    },

    onChange: function() {
      this.set('value', Skin.getProp(this.$skin, 'value'));
    }
  });

  Exact.Input = Input;

  Exact.RES.register('Input', Input);

})();

//######################################################################################################################
// src/more/inputs/TextBox.js
//######################################################################################################################
(function() {

  'use strict';

  var Input = Exact.Input;

  function TextBox() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: TextBox, extend: Input,

    statics: {
      $template: '<input type="text">'
    }
  });

  Exact.TextBox = TextBox;

  Exact.RES.register('TextBox', TextBox);

})();

//######################################################################################################################
// src/more/inputs/CheckBox.js
//######################################################################################################################
(function() {

  'use strict';

  var Input = Exact.Input;

  var base = Input.prototype;

  function CheckBox() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: CheckBox, extend: Input,

    statics: {
      $template: '<input type="checkbox">'
    },

    ready: function(props) {
      base.ready.call(this, props);

      this.onChoicesChanged = this.onChoicesChanged.bind(this);

      var self = this;
      this.on('changed.choices', function() {
        self.choices.off('changed', self.onChoicesChanged);
        self.onChoicesChanged();
        self.choices.on('changed', self.onChoicesChanged);
      });
    },

    toggle: function() {
      this.set('checked', !this.checked);
    },

    onChoicesChanged: function() {
      if (this.choices) {
        this.set('checked', this.choices.indexOf(this.value) >= 0);
      }
    },

    onChange: function() {
      this.toggle();

      if (this.choices) {
        if (this.checked) {
          this.choices.push(this.value);
        } else {
          this.choices.splice(this.choices.indexOf(this.value), 1);
        }
      }

    }
  });

  Exact.CheckBox = CheckBox;

  Exact.RES.register('CheckBox', CheckBox);

})();

//######################################################################################################################
// src/more/inputs/Radio.js
//######################################################################################################################
(function() {

  'use strict';

  var Input = Exact.Input;

  var base = Input.prototype;

  function Radio() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Radio, extend: Input,

    statics: {
      $template: '<input type="radio">'
    },

    ready: function(props) {
      base.ready.call(this, props);

      this.onChangedChoice = this.onChangedChoice.bind(this);
      this.on('changed.choice', this.onChangedChoice);
    },

    toggle: function() {
      this.set('checked', !this.checked);
    },

    onChangedChoice: function() {
      this.set('checked',  this.choice === this.value);
    },

    onChange: function() {
      this.toggle();
      if (this.checked) {
        this.set('choice', this.value);
      }
    }
  });

  Exact.Radio = Radio;

  Exact.RES.register('Radio', Radio);

})();

//######################################################################################################################
// src/more/inputs/Select.js
//######################################################################################################################
(function() {

  'use strict';

  var List = Exact.List;
  var Input = Exact.Input;

  var base = Input.prototype;

  function Select() {
    List.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Select, extend: List,

    statics: {
      $template: '<select></select>'
    },

    onChange: base.onChange,

    register: base.register,

    ready: base.ready
  });

  Exact.Select = Select;

  Exact.RES.register('Select', Select);

})();

//######################################################################################################################
// src/more/inputs/TextArea.js
//######################################################################################################################
(function() {

  'use strict';

  var Input = Exact.Input;

  function TextArea() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: TextArea, extend: Input,

    statics: {
      $template: '<textarea></textarea>'
    }
  });

  Exact.TextArea = TextArea;

  Exact.RES.register('TextArea', TextArea);

})();

//######################################################################################################################
// src/exit.js
//######################################################################################################################
//(function(global, module) {
//  'use strict';
//
//  var Exact = { version: '0.0.3' };

  if (module) {
    module.exports = Exact;
  } else {
    global = global || window || {};
    global.Exact = Exact;
    Exact.global = global;
  }

})(typeof global !== 'undefined' ? global : undefined, typeof module !== 'undefined' ? module : undefined);
