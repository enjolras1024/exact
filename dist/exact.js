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
    '$set': true, '$push': true, '$unshift': true, '$splice': true, '$apply': true
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
      Array$unshift.unshift.apply(target, specs['$unshift']); //TODO: unshift as outer func
    } else if (specs.hasOwnProperty('$splice')) {
      Array$splice.splice.apply(target, specs['$splice']); //TODO: unshift as outer func
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
// src/apis/constants.js
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

      return res;
    },

    /**
     *
     * @param {string} path
     * @param {*} value
     * @returns {boolean}
     */
    register: function(path, value) {
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

      if (target.hasOwnProperty(path)) {
        //console.warn('already exists');
        return false;
      }

      ObjectUtil_defineProp(target, path, {value: value});

      return true;
    }
  }});

})();

//######################################################################################################################
// src/apis/functions.js
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

})();

//######################################################################################################################
// src/utils/StringUtil.js
//######################################################################################################################
(function() {

  'use strict';

  var QUOTE_CODE = "'".charCodeAt(0);
  var SPACE_CODE = ' '.charCodeAt(0);
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
        
        if (cc === SPACE_CODE) {
          cb = cc;
          continue;
        }

        if (cc === QUOTE_CODE && cb !== SLASH_CODE) {
          cb = cc;
          iq = !iq;
          continue;
        }
        
        if (!ct) {
          cl = -1;
          cr = -1;

          if (cc === brackets[0] && !iq) {
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

        if (!iq && !ct && cc === delimiter) {
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

  function toNumber(expr) {
    return Number(expr);
  }

  function toString(expr) {
    return expr;
  }

  //string in single quotes
  function toStrISQ(expr) {
    var i = expr.indexOf("'");
    var j = expr.lastIndexOf("'");

    return expr.slice(i+1, j);
  }

  function toJSON(expr) {
    return toAnyValue(expr) || null;
  }

  var typedParsers = {
    'boolean': toBoolean,
    'number': toNumber,
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

    if (SPECIAL_VALUES.hasOwnProperty(expr)) {
      return toSpecial(expr);//SPECIAL_VALUES[expr];
    } else if (!isNaN(expr)) {
      return toNumber(expr);//Number(expr);
    } else if (STRING_IN_SINGLE_QUOTES_REGEXP.test(expr)) {
      return toStrISQ(expr);
    } else /*if (JSON_LIKE_REGEXP.test(expr))*/ {
      return toAnyValue(expr);
    }
    //else, return undefined
  }

  Exact.LiteralUtil = {

    parse: parse,

    toNumber: toNumber,

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

  function makeExpressionEvaluator(expr, args) {
    return new Evaluator(new Function(args || '', 'var $ = this; return ' + expr + ';'), '$');
  }

  function evaluateArgs(args, flags, scope) {
    var i,  n, arg, flag;

    for (i = 0, n = flags.length; i < n; ++i) {
      flag = flags[i];

      if (!flag) { continue;} // arg is literal

      arg = args[i];

      if (flag === 1) {       // arg is path
        args[i] = RES.search(arg, scope, true);
        continue;
      }

      if (flag === 2) {       // arg is evaluator
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
    var $ = null, exec, args, flags, hasFirstValue = arguments.length > 4;

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

    args = evaluator.args;

    if (!args) {
      return hasFirstValue ? exec.call($, value) : exec.call($);
    }

    if (args === '$') {
      return exec.call(scope, event);
    }

    flags = args.flags;
    args = args.slice(0); //copy

    if (flags) {
      evaluateArgs(args, flags, scope);
    }

    if (hasFirstValue) {
      args.unshift(value);
    }

    return exec.apply($, args);
  }

  Exact.EvaluatorUtil = {
    makeExpressionEvaluator: makeExpressionEvaluator,
    makeGetEvaluator: makeGetEvaluator,
    makeNotEvaluator: makeNotEvaluator,
    makeEvaluator: makeEvaluator,
    applyEvaluator: applyEvaluator
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

    handlers.push(handler);

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
        for (i = 0; i < n; ++i) {
          handler = handlers[i];// handlers[ i ]( event.clone() );

          if (event.keyName && event.keyName !== handler.keyName) { continue; }

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
      } else {//  .on('click', context.onClick);
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

  var set;

  if (canDefineGetterAndSetter) {
    set = function set(key, value) {
      if (key === undefined) { return this; }

      var type = typeof key, set = this.constructor.set, descriptors = this._descriptors_;

      if (type !== 'object') {

        if (descriptors && (key in descriptors)) {
          this[key] = value;
        } else {
          set.call(this, key, value, this[key], this, descriptors);
        }

      } else if (key) {

        var props = key;

        if (descriptors) {
          for (key in props) {
            if (!props.hasOwnProperty(key)) { continue; }

            if (key in descriptors) {
              this[key] = props[key];
            } else {
              set.call(this, key, props[key], this[key], this, descriptors);
            }
          }
        } else {
          for (key in props) {
            if (props.hasOwnProperty(key)) {
              set.call(this, key, props[key], this[key], this, descriptors);
            }
          }
        }
      }

      return this;
    };
  } else {
    set = function set(key, value) {
      if (key === undefined) { return this; }

      var type = typeof key, set = this.constructor.set, descriptors = this._descriptors_;

      if (type !== 'object') {

        set.call(this, key, value, this[key], this, descriptors);

      } else if (key) {

        var props = key;

        for (key in props) {
          if (props.hasOwnProperty(key)) {
            set.call(this, key, props[key], this[key], this, descriptors);
          }
        }
      }

      return this;
    };
  }

  function makeGetter(key) {
    return function() {
      return this._props[key];
    }
  }

  function makeSetter(key) {
    return function(val) {
      var _props = this._props;
      _props.set(key, val, _props[key], this, this._descriptors_);
    }
  }

  function Accessor(props) {
    throw new Error('Accessor is abstract class and can not be instantiated');
  }

  Exact.defineClass({

    constructor: Accessor,

    statics: {



      set: function(key, val, old/*, accessor, descriptors*/) {
        this[key] = val;

        //if (this[key] === undefined) {
        //  delete this[key];
        //}

        return this[key] !== old;
      },

      initialize: function initialize(accessor, props) {
        var constructor = accessor.constructor, descriptors = constructor.descriptors;

        if (!accessor._descriptors_ && Array.isArray(descriptors)) { // like ['title', 'name', {price: {type: 'number'}}]
          var n = descriptors.length,  keys = descriptors.slice(0), key, desc;

          if (typeof keys[n-1] === 'object') {
            descriptors = keys.pop();
          } else {
            descriptors = {};
          }

          n = keys.length;

          while (--n >= 0) {
            descriptors[keys[n]] = {};
          }

          if (canDefineGetterAndSetter) {
            var _props = {};

            ObjectUtil_defineProp(accessor, '_props', {value: _props});
            ObjectUtil_defineProp(_props, 'set', {value: constructor.set});

            for (key in descriptors) {
              if (!descriptors.hasOwnProperty(key)) { continue; }

              desc = descriptors[key];

              var opts = {
                enumerable: 'enumerable' in desc ? desc.enumerable : true,
                configurable: 'configurable' in desc ? desc.configurable : true
              };

              if ('set' in desc) {
                opts.get = desc.get;
                opts.set = desc.set;
              } else if (!('get' in desc)){
                opts.get = makeGetter(key);
                opts.set = makeSetter(key);
              } else {
                opts.get = desc.get;
              }

              ObjectUtil_defineProp(accessor, key, opts);
            }
          }

          ObjectUtil_defineProp(accessor, '_descriptors_', {value: descriptors});
        }

        //if (accessor._props === undefined) {
        //  ObjectUtil_defineProp(accessor, '_props', {value: accessor});
        //}

        if (typeof accessor.defaults === 'function') {
          var defaults = accessor.defaults();
        }

        accessor.set(ObjectUtil_assign({}, defaults, props));
      }
    },

    $get: canDefineGetterAndSetter ? function $get(key) {
      return this._props[key];
    } : null,

    $set: canDefineGetterAndSetter ? function $set(key, val) {
      var _props = this._props;
      _props.set(key, val, _props[key], this, this._descriptors_);
    } : null,

    /**
     * Set the prop by given key or set some props.
     *
     * @param {string|Object} key
     * @param {*} value
     * @returns {self}
     */
    set: set
  });

  Exact.Accessor = Accessor;

})();

//######################################################################################################################
// src/base/Validator.js
//######################################################################################################################
(function() {

  'use strict';

  var TYPE_REGEXPS = {
    number: /\bnumber\b/,
    string: /\bstring\b/,
    boolean: /\bboolean\b/
  };

  /**
   * Validator provides the `validate()` method.
   *
   * @example A constructor has descriptors:
   *
   *  { name: 'string', role: Student, age: {type: 'number', validate: validateRange} }
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
        var error, validate, pattern, type, desc;//, descriptors = constructor._descriptors_;

        if (descriptors && descriptors.hasOwnProperty(key)) {
          desc = descriptors[key]; //TODO: descriptions[key]

          if (!desc) { return true; }

          var t = typeof desc;

          if (t === 'string' || t === 'function') { // Like {name: 'string', role: Student} where Student is constructor
            type = desc;
          } else if (t === 'object') {
            type = desc.type;
            pattern = desc.pattern;
          } else {
            return true;
          }
//        required = desc.required; //TODO: coerce
          validate = desc.validate;

          if (!error && type) {
            error = Validator.validateType(accessor, key, value, type);
          }

          if (!error && pattern) {
            error = Validator.validatePattern(accessor, key, value, pattern);
          }

          if (!error && typeof validate === 'function') {
            error = validate.call(accessor, value, key);
          }

          if (error) {
            if ('development' === 'development') {
              console.warn('Invalid:', error.message);
            }

            if (accessor.on && accessor.send) {
              accessor.send('invalid.' + key, error);
            }

            return false;
          }
        }

        return true;
      },

      /**
       * Validate the type of the value when the key is set in accessor.
       *
       * @param {Accessor} accessor
       * @param {string} key
       * @param {*} value
       * @param {string|Function} type
       * @returns {TypeError}
       */
      validateType: function validateType(accessor, key, value, type) {
        if (value === undefined) { return; } //TODO: required ?

        var t1 = typeof type, t2, error, constructor;

        t2 = typeof value;
//      if (t1 === 'string' && (t2 = typeof value) !== type) {
        if (t1 === 'string' && !TYPE_REGEXPS[t2].test(type)) {
          t1 = type;

          error = true;
        } else if (t1 === 'function' && !(value instanceof type)) {
          t1 = type.fullName || type.name;

          constructor = value.constructor;
          t2 = constructor.fullName || constructor.name;

          error = true;
        }

        if (error) {
          constructor = accessor.constructor;

          return makeTypeError(constructor.fullName || constructor.name, key, t1, t2);
        }
      },

      validatePattern: function validatePattern(accessor, key, value, pattern) {
        if (!pattern.test(value)) {
          return new Error(value, 'does not match the pattern ' + pattern.toString());
        }
      }
    }
  });

  function makeTypeError(constructorName, propertyName, expectedType, actualType) {
    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be `' + expectedType + (actualType ? '`, not `' + actualType : '') + '`');
  }

  Exact.Validator = Validator;

})();

//######################################################################################################################
// src/base/DirtyChecker.js
//######################################################################################################################
(function() {

  'use strict';

  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

  function DirtyChecker() {
    throw new Error('DirtyChecker is static class and can not be instantiated');
  }

  Exact.defineClass({

    constructor: DirtyChecker,

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
      },

      hasDirty: function hasDirty(object, key) { // hasDirtyAttr, hasDirty
        var _dirty = object._dirty;
        return _dirty ? (key === undefined || _dirty.hasOwnProperty(key)) : false;
      }
    },

    /**
     * Find if some prop is dirty.
     *
     * @param {string} key
     * @returns {boolean}
     */
    hasDirty: function hasDirty(key) { // hasDirtyAttr, hasDirty
      var _dirty = this._dirty;
      return _dirty ? (key === undefined || _dirty.hasOwnProperty(key)) : false;
    }
  });

  Exact.DirtyChecker = DirtyChecker;

})();

//######################################################################################################################
// src/core/models/Cache.js
//######################################################################################################################
(function() {
  'use strict';

  var Accessor = Exact.Accessor;
  var DirtyChecker = Exact.DirtyChecker;

  var Accessor_set = Accessor.set;
  var DirtyChecker_check = DirtyChecker.check;
  var DirtyChecker_clean = DirtyChecker.clean;

  /**
   *
   * @constructor
   */
  function Cache(props) { //
    Accessor.initialize(this, props);
  }

  Exact.defineClass({

    constructor: Cache,

    mixins: [Accessor.prototype],

    //onChange: null,

    statics: {

      set: function set(key, val, old, model, descriptors) {
        var changed = Accessor_set.call(this, key, val, old, model, descriptors);

        if (changed) {
          DirtyChecker_check(model, key, this[key], old);

          if (model.onChange) {
            model.onChange();
          }
        }

        return changed;
      },

      clean: DirtyChecker_clean
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
      set: function (key, val, old, store, descriptors) {

        if (!Validator_validate(store, key, val, descriptors)) { return false; }

        var changed = Accessor_set.call(this, key, val, old, store, descriptors);

        if (changed) {
          store.send('changed.' + key);
        }

        return changed;
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
  function Collection() {//TODO: ShadowCollection, ShadowList?
    this.push.apply(this, arguments);
  }

  var base = Array.prototype;

  function invalidate(collection, key) {
    collection.isInvalid = true;
    collection.send('changed'); //collection.send(key ? 'change.' + key : 'change);

    if (collection.onChange) {
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
        collection.isInvalid = false;
      }//,
    },

    //invalidate: null,

//    clean: function() {
//      this.isInvalid = false;
//    },

    push: function() {
      base.push.apply(this, arguments);

      invalidate(this);

      return this.length;
    },

    pop: function() {
      var popped = base.pop.call(this);

      invalidate(this);

      return popped;
    },

    unshift: function() {
      base.unshift.apply(this, arguments);

      invalidate(this);

      return this.length;
    },

    shift: function() {
      var shifted = base.shift.call(this);

      invalidate(this);

      return shifted;
    },

    splice: function() {
      var spliced = base.splice.apply(this, arguments);

      invalidate(this);

      return spliced;
    },

    sort: function(comparator) {
      base.sort.call(this, comparator);

      invalidate(this);

      return this;
    },

    //slice: function() { //proxy('slice', true)
    //  var array = base.slice.apply(this, arguments);
    //
    //  var collection = new Collection();
    //
    //  base.push.apply(collection, array);
    //
    //  return collection;
    //},
    //
    //concat: function() { //proxy('concat', true)
    //  var array = base.concat.apply(this, arguments);
    //
    //  var collection = new Collection();
    //
    //  base.push.apply(collection, array);
    //
    //  return collection;
    //},

    //TODO: filter, sort, map, ...

    set: function(index, item) {
      if (index >= this.length) {
        for (var i = this.length;  i < index; ++i) {
          base.push.call(this, undefined);
        }

        base.push.call(this, item);
      } else {
        if (this[index] === item) { return this; }
        this[index] = item;
      }

      invalidate(this);

      return this;
    },

    reset: function(items) {
      var i, n, m, min;
      n = this.length;
      m = items.length;

      //console.log(n,items,items.length,items[0]);

      if (n > m) {
//        min = m;
        base.splice.call(this, m);
      } /*else {
       min = n;
       base.push.apply(this, items.slice(min));
       }*/

      for (i = 0;  i < m; ++i) {
        this[i] = items[i];
      }

      this.length = m;

      invalidate(this);

      return this;

    },

    insert: function(item, before) { //TODO: before can be number index
      if (!(item instanceof Object) || !(before instanceof Object)) {
        throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      }

      var i, n;

      n = this.length;

      if (before && before === item) { return this; }

      for (i = 0; i < n; ++i) {
        if (this[i] === item) {
          if (i === n-1) {
            return this;
          }

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

      invalidate(this);

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

      invalidate(this);

      return this;
    },

    replace: function(item, existed) {
      if (!(item instanceof Object) || !(existed instanceof Object)) {
        throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      }

//      if (item === existed) { return this; }

      var i, n;

      for (i = 0, n = this.length; i < n; ++i) {
        if (this[i] === existed) {
          this.set(i, item);
          break;
        }
      }

      if (i === n) { //TODO: silent
        throw new Error('The item to be replaced is not existed in this collection');
      }

//      invalidate(this);

      return this;
    },

    empty: function() {
      this.splice(0);

//      invalidate(this);

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
  var DirtyChecker = Exact.DirtyChecker;

  var setImmediate = Exact.setImmediate;

  var ObjectUtil = Exact.ObjectUtil;

  var Accessor_set = Accessor.set;
  var DirtyChecker_check = DirtyChecker.check;
  var DirtyChecker_clean = DirtyChecker.clean;

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

//    extend: Context,
    mixins: [Accessor.prototype, DirtyChecker.prototype],

    /**
     * Make this shadow invalid and register it to the batchUpdater.
     *
     * @returns {self}
     */
    invalidate: function invalidate(key, val, old) { //TODO: as static method, maybe

      if (!this.isInvalid /*&& this.isDirty()*/) {
        console.log('invalidate', this.toString());
        this.isInvalid = true;
        Updater.insert(this);
      }

      return this;
    },

    update: function update() { //TODO: enumerable = false
      if (!this.isInvalid) { return; } // TODO: _secrets, is.invalid, is.refreshed,

      console.log('update', this.toString());

      if (this.refresh) {
        this.refresh();
      } //TODO: shouldRefresh()�� last chance to update shadow and its children

      if (this.send) {
        //shadow.send('refresh');//TODO: beforeRefresh, refreshing
        this.send('refreshed');//TODO: beforeRefresh, refreshing
      }

      Updater.append(this);
      //Shadow.render(this);
      //Shadow.clean(this);
    },

    render: function render() {
//        if (!shadow.isInvalid) { return; }

      var $skin = this.$skin,
        props = this,
        attrs = this._attrs,
        style = this._style,
        classes = this._classes,
        children = this._children,
        dirty = null;

      if (props && props._dirty) { //TODO: textContent => children
        dirty = props._dirty;
        Shadow.clean(props);

        Skin.renderProps($skin, props, dirty);
      }

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

        if (children && children.isInvalid) {
          Collection.clean(children);

          var $removed = Skin.renderChildren($skin, extract(children));

          if ($removed && $removed.length > 0) {
            for (var i = 0, n = $removed.length; i < n; ++i) {
              var $parent = Skin.getParent($removed[i]);
              if (!$parent) {
                var shadow = Shadow.getShadow($removed[i]);
                Shadow.release(shadow);
              }
            }
          }
          // It is a little hard for IE 8
        }
      }
    },

    //TODO: debug
    toString: function toString() {
      var constructor = this.constructor;

      var tag = Skin.getProp(this.$skin, 'tagName');

      return (constructor.fullName || constructor.name) + '<' + (tag ? tag.toLowerCase() : '') + '>('+this.guid+')';
    },

    blur: function blur() {
      var $skin = this.$skin;
      setImmediate(function() {
        Skin.blur($skin);
      });
    },

    focus: function focus() {
      var $skin = this.$skin;
      setImmediate(function() {
        Skin.focus($skin);
      });
    },

    statics: {

      set: function set(key, val, old, shadow, descriptors) { // TODO: params
        var changed = Accessor_set.call(this, key, val, old, shadow, descriptors);

        if (changed) {
          DirtyChecker_check(shadow, key, this[key], old);

          shadow.invalidate(key, this[key], old);//TODO:
        }
 
        return changed;
      },


      /**
       * @param {Shadow} shadow
       * @param {string} tag
       * @param {Object} props
       */
      initialize: function initialize(shadow, tag, props) {
//        throw new Error('initialize() must be implemented by subclass!');

        Shadow.initSkin(shadow, tag);

        if (Skin.isElement(shadow.$skin)) {
          defineMembersOf(shadow);
        }

        shadow.guid = ++uid;
        shadow.update = shadow.update.bind(shadow);
        shadow.render = shadow.render.bind(shadow);
        shadow.invalidate = shadow.invalidate.bind(shadow);
        //shadow._update = Shadow.update.bind(null, shadow);

        Accessor.initialize(shadow, props);
      },

      /**
       * Create $skin for the shadow.
       *
       * @param {Shadow} shadow
       * @param {string} tag
       */
      initSkin: function initSkin(shadow, tag) {
        ObjectUtil_defineProp(shadow, '$skin', {value: tag/* !== 'TEXT'*/ ? Skin.createElement(tag) : Skin.createText('')}); //TODO: $shin._secrets = {$skin: ...}
//        shadow.$skin._shadow = shadow; //TODO: strict
        if (Skin.canExtend(shadow.$skin)) {
          ObjectUtil_defineProp(shadow.$skin, '_shadow', {value: shadow});
        }
      },

      clean: function clean(shadow) {
        shadow.isInvalid = false;
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
        var action = shadow._actions[type], $skin;

        $skin = shadow.$skin;

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
        var actions = shadow._actions, action = actions[type], $skin;

        $skin = shadow.$skin;

        if (Skin.mayDispatchEvent($skin, type)) {
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
  //var hasDirty = Exact.DirtyChecker.hasDirty;

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
        Shadow.initialize(text, '', {data: data});
        //Shadow.initialize(text, 'TEXT', {data: data});
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


  function Element(tag, props) {
    Element.initialize(this, tag, props);
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
       * @param {Object} props
       * @returns {Element}
       */
      create: function create(tag, props) {

        return new Element(tag, props);
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
  //var Commander = Exact.Commander;
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
    //TYPE: 'Exact.Component',
    constructor: Component,

    extend: Shadow,

    mixins: [Watcher.prototype/*, Context.prototype*/],

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

      create: function create(ClassRef, props) { // TODO: build
        return new ClassRef(props);
      },

      destroy: function destroy(component) {
        var i, n, child, children = component.children;

        for (i = 0, n = children.length; i < n; ++i) {
          child = children[i];
          child.constructor.destroy(child);
        }

        component.off();
        Shadow.clean(component);
      },

      release: function release(component) {
        var i, children = component._children;
        if (children) {
          for (i = children.length - 1; i >= 0; --i) {
            Shadow.release(children[i]);
          }
        }

        var binding, _bindings = component._bindings;
        if (_bindings) {
          for (i = _bindings.length - 1; i >= 0; ++i) {
            binding = _bindings[i];
            binding.constructor.clean(binding);
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
            template = HTMXTemplate.parse(constructor.$template, constructor.imports);
          } else {
            template = HTMXTemplate.parse('<div></div>', constructor.imports);
            //throw new TypeError('$template must be legal HTML string or element');
          }

          constructor.template = template;
        } else if (!(template instanceof HTMXTemplate)) {
          throw new TypeError('The template must be instance of Exact.HTMXTemplate');
        }

        //TODO: check component.render()

        //props.tag = template.tag;

        Shadow.initialize(component, template.tag, props);
//        Accessor.initialize(component);

        HTMXTemplate.compile(template, component);

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
      //var isInvalid = this.isInvalid;
      //
      //if (!isInvalid /*&& this.isDirty()*/) {
      //  this.isInvalid = true;
      //  console.log('invalidate', this.toString());
      //}

      if (key) {
        this.send('changed.' + key, val, old);
      }

      //if (!isInvalid) {
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
            imports: {},
            template: list.itemTemplate//this.contents[0].$skin
          }
        });

        list.itemAdapter = itemAdapter;
      } /*else {
        itemAdapter = Exact.defineClass({
          extend: Component,
          statics: {
            imports: {},
            //$template: "`item`"
            $template: '<span>`${$.item}`</span>'
          }
        });
      }*/

      //list.itemAdapter = itemAdapter;
    }

  }

  function List() {
    Component.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: List, extend: Component,

    statics: {
      fullName: 'List',
      //imports: {},
      $template: '<ul></ul>'
    },

    register: function() {
      //this.refresh = this.refresh.bind(this);
    },

    ready: function() {
      //this.on('change.items', this.invalidate);
      //this.on('change.itemAdapter', function() {
      //  console.log('change.itemAdapter');
      //});
      //this.on('refresh', this.refresh.bind(this));
    },


    refresh: function() {

      var i, n, m, item, items = this.items, itemAdapter, child, children = this.children, contents = [];

      if (!items) { return; }

      n = items.length;
      m = children.length;

      checkAdapterOf(this);

      itemAdapter = this.itemAdapter;

      if (!itemAdapter) {return;}

      for (i = 0; i < n; ++i) {
        item = items[i];
        //item._toIndex = i;
        item._fromIndex = -1;
        //children.push(i, new itemAdapter({item: items[i]}));
      }

      for (i = 0; i < m; ++i) {
        item = children[i].item;
        if ('_fromIndex' in item) {
          item._fromIndex = i;
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
      }

    }
  });

  Exact.List = List;

})();

//######################################################################################################################
// src/core/bindings/Binding.js
//######################################################################################################################
(function() {

  'use strict';

  var RES = Exact.RES;
  var EvaluatorUtil = Exact.EvaluatorUtil;
  var applyEvaluator = EvaluatorUtil.applyEvaluator;

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

        if (mode > 0/* && binding.life*/) {
          if (scopeEvent) {
            scope.on(scopeEvent, binding.exec);
          } else if (scopePaths) {
            eye('on', scopePaths, scope, target, binding);
          }

          if (mode === 2) {
            eye('on', [prop], target, source, binding);
          }
        }

        return binding;
      },

      clean: function(binding) {
        if (binding.scopeEvent) {
          binding.scope.off(binding.scopeEvent, binding.exec);
        } else if (binding.scopePaths) {
          eye('off', binding.scopePaths, binding.scope, binding.target, binding);
        }

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

      //if (this.mode > 0 && !(--this.life)) {
      //  Binding.clean(this);
      //}
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

  function eye(fn, paths, scope, target, binding) {
    var i, j, n, path, attr, watcher, exec;

    for (i = 0, n = paths.length; i < n; ++i) {
      path = paths[i];//.name;
      j = path.lastIndexOf('.');
      if (j < 0) {
        attr = path;
        watcher = scope;
      } else {
        attr = path.slice(j + 1);
        watcher = RES.search(path.slice(0, j), scope, true);
      }

      if (watcher && watcher[fn]) {

        watcher[fn]('changed.' + attr, binding.exec);// TODO: binding.invalidate

        if (fn === 'on') {
          record(target, binding);
        } else {
          remove(target, binding);
        }
      }
    }
  }

  function record(target, binding) {
    var _bindings = target._bindings;

    if (_bindings) {
      _bindings.push(binding);
    } else {
      target._bindings = [binding];
    }
  }

  function remove(target, binding) {
    var _bindings = target._bindings;

    _bindings.splice(_bindings.indexOf(binding), 1);
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
// src/core/models/StringTemplate.js
//##############################################################################
(function() {
  'use strict';
  
  var Cache = Exact.Cache;
  var DirtyChecker = Exact.DirtyChecker;
  var ExpressionUtil = Exact.ExpressionUtil;

  var Array$join = Array.prototype.join;
  
  
  function Fragment() {
    Cache.apply(this, arguments);
  }
  
  Exact.defineClass({
    constructor: Fragment,
    extend: Cache,
    mixins: [DirtyChecker.prototype],
    toString: function() {
      return Array$join.call(this, '');
    }
  });

  function StringTemplate() {
    this.push.apply(this, arguments);
  }
  
  Exact.defineClass({
    constructor: StringTemplate, extend: Array,
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

        if (template.mode > 0) {
          scope.on('refreshed', exec);
        }

        fragment.onChange = scope.invalidate;
 
      }
    }
  });

  Exact.StringTemplate = StringTemplate;

})();

//######################################################################################################################
// src/core/templates/StyleTemplate.js
//######################################################################################################################
(function() {
  
  'use strict';

  function StyleXTemplate(literals, expressions) {
    this.literals = literals;
    this.expressions = expressions; //this.expressions = null;
  }

  StyleXTemplate.compile = function(template, target) {

  };

  Exact.StyleXTemplate = StyleXTemplate;

})();


(function() {
  'use strict';

  var Text = Exact.Text;
  var Shadow = Exact.Shadow;
  var Element = Exact.Element;
  var Component = Exact.Component;

  var ObjectUtil = Exact.ObjectUtil
  var ExpressionUtil = Exact.ExpressionUtil;

  function HTMXTemplate() {
    this.id = '';         //string, local id
    this.as = '';         //string, key in target
    this.tag = '';        //string, tag name
    this.type = null;     //Function, constructor
    this.stay = false;    //boolean
    this.attrs = null;    //Object like {literals: {title: 'Hi'}, expressions: {'data-msg': {...}}}
    this.style = null;    //Object like {literals: {color: 'red'}, expressions: {fontSize: {...}}}
    //this.actions = null;  //Object like {literals: {click: 'onClick'}, expressions: {change: {...}}}
    this.classes = null;  //Object like {literals: {highlight: true}, expressions: {active: {...}}}
    this.children = null; //Array like []
    this.literals = null; //Object like {title: 'Hi'}
    this.expressions = null; //Object like {title: {type: null, template: null}}
  }

  HTMXTemplate.parse = null; // Interface,

  function initStyle(target, scope, template) {
    //var styleString = template.literals.style;//TODO: warn in HTMLTemplate
    if (template.style) {
      initProps(target.style, scope, template.style);
    }
  }
  
  function initAttrs(target, scope, template) {
    if (template.attrs) {
      initProps(target.attrs, scope, template.attrs);
    }
  }

  function initProps(target, scope, template) {
    if (!template) { return; }

    var literals = template.literals;
    var expressions = template.expressions;

    if (literals) {
      target.set(literals);
      //target.reset(literals);
    }

    if (expressions) {
      scope._expressionsQueue.push({target: target, expressions: expressions});
    }
  }

  function initClasses(target, scope, template) {
    if ((template.expressions && template.expressions.className) && template.classes) {
      console.warn('ignore'); //TODO: warn in HTMXTemplate, class="`btn &{$.active? 'active':''}`"
    }

    var i, names, classes, literals = template.literals, className = literals ? literals.className : '';

    if (className) {
      if (!template.classes) {
        template.classes = new Exact.StyleXTemplate();
      }

      classes = template.classes;

      if (!classes.literals) {
        classes.literals = {};
      }

      literals = classes.literals;

      names = className.split(/\s/);
      for (i = 0; i < names.length; ++i) {
        literals[names[i]] = true;
      }
    }

    if (template.classes) {
      initProps(target.classes, scope, template.classes);
    }
  }

  function initSelf(target, scope, template) {
    //TODO:

    initProps(target, scope, template);
    initAttrs(target, scope, template);
    initStyle(target, scope, template);
    initClasses(target, scope, template);
    //initActions(target, scope, template);
  }


  function initChildren(target, scope, template) {
    var i, n, id, tag, type, child, content, contents = [], children = template.children;

    if (!children) { return; }

    for (i = 0, n = children.length; i < n; ++i) {
      child = children[i];

      if (typeof child === 'string') {
        content = Text.create(child);
      } else if (ExpressionUtil.isExpression(child)) {
        content = Text.create('');
        scope._expressionsQueue.push({target: content, expressions: {data: child}});
      } else if (child instanceof Object) {
        id = child.id;
        tag = child.tag;
        type = child.type;
        //literals = child.literals; //TODO:

        if (!type) {
          content = Element.create(tag);
        } else {
          content = Component.create(type);
        }
        //TODO: collect contents/slots, scope._expressionsQueue.push({target: content, expressions: {placeholder: {}}});
        initSelf(content, scope, child);
        initChildren(content, scope, child);

        if (id) {
          scope[id] = content; //TODO: addPart
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
    var i, n, queue = component._expressionsQueue, item, key, target, expression, expressions;

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

  HTMXTemplate.compile = function compile(template, component) {
    component._expressionsQueue = []; //TODO: _todos

    initSelf(component, component, template);
    initChildren(component, component, template);

    initExpressions(component);

    delete component._expressionsQueue;
  };

  Exact.HTMXTemplate = HTMXTemplate; //HTMXTemplate

})();

//######################################################################################################################
// src/htmx/parsers/ExpressionParser.js
//######################################################################################################################
(function() {

  'use strict';

  var helpers = {};

  //var IS_VAR_REG_EXP = /^(\S+)\{[\S ]+\}$/;
  var IS_EXPR_REG_EXP = /^\S+\{.*\}$/;

  Exact.ExpressionParser = {

    isExpression: function(expr) {
      return typeof expr === 'string' ? IS_EXPR_REG_EXP.test(expr) : false;
    },

    registerHelper: function(symbol, helper) {
      if (helpers.hasOwnProperty(symbol)) {
        return false;
      }

      helpers[symbol] = helper;

      return true;
    },

    /**
     * @example
     *    <div click="@{onClick}" title="&{$.title | upper}">
     *      <label>`&{$.label}:`</label>
     *      <input type="text" x-type="TextBox" value="#{$.username}">
     *    </div>
     *
     * @param {string} expr
     * @param {Object} imports
     * @returns {*}
     */
    parse: function(expr, imports) {
      var i, j, symbol, config, helper;

      i = expr.indexOf('{');
      j = expr.lastIndexOf('}');

      symbol = expr.slice(0, i);
      config = expr.slice(i+1, j); //expr.length-1

      helper = helpers[symbol];

      return helper && helper(config, imports);
    }
  };

})();

//######################################################################################################################
// src/htmx/parsers/TextStringParser.js
//######################################################################################################################
(function() {
  'use strict';

  var StringTemplate = Exact.StringTemplate;
  var ExpressionUtil = Exact.ExpressionUtil;
  var ExpressionParser = Exact.ExpressionParser;

  //var BINDING_REGEXP = /([\$&#]\{.+\})/;
  var BINDING_REGEXP = /([\$&#]\{.+?\})/;
  //var BINDING_REGEXP = /([\$&#]\{[^\{\}]+\})/;

  //var TEXT_FRAG_REG_EXP = /^`.*([@&\$]\{[\$\w\.]+\}).*`$/;
  //var TEXT_FRAG_REG_EXP = /^`[^`]*([@&\$]\{[\$\w\.\, ]*(\|[^`]+)*\})[^`]*`$/;
  var STRING_TEMPLATE_REG_EXP = /^`[^`]*([@&\$]\{[^`]+})[^`]*`$/;


  Exact.TextStringParser = {

    isStringTemplate: function (expr) {
      return typeof expr === 'string' ? STRING_TEMPLATE_REG_EXP.test(expr) : false;
    },

    /**
     * @example
     *    <div title="`The title is &{$.title}`">`${$.a} + ${$.b} = ${$.a + $.b}`</div>
     *
     * @param {string} expr
     * @param {Object} imports
     * @returns {*}
     */
    parse: function(expr, imports) {
      expr = expr.trim().slice(1, expr.length-1);

      var i, n, piece, pieces = expr.split(BINDING_REGEXP), expression;

      pieces.mode = 0;

      for (i = 0, n = pieces.length; i < n; i += 2) {
        piece = pieces[i+1];

        if (piece) {
          expression = ExpressionParser.parse(piece, imports);

          pieces[i+1] = expression;

          if (expression.template.mode > 0) {
            pieces.mode = 1;
          }
        }
      }

      return ExpressionUtil.makeExpression(StringTemplate, pieces);
    }
  };

})();

//######################################################################################################################
// src/htmx/parsers/HandlerParser.js
//######################################################################################################################
(function() {

  'use strict';

  var EvaluatorUtil = Exact.EvaluatorUtil;
  var ExpressionUtil = Exact.ExpressionUtil;

  var HandlerTemplate = Exact.HandlerTemplate;

  var ExpressionParser = Exact.ExpressionParser;

  function parse(expr) {
    expr = expr.trim();

    var template = new HandlerTemplate();

    if (/^[\w\$]+$/.test(expr)) {
      template.name = expr;
    } else {
      template.exec = EvaluatorUtil.makeExpressionEvaluator(expr, 'event').exec;
    }

    return ExpressionUtil.makeExpression(HandlerTemplate, template);
  }

  ExpressionParser.registerHelper('@', parse);

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

  var ExpressionParser = Exact.ExpressionParser;

  var StringUtil_split = StringUtil.split;

  var makeEvaluator = EvaluatorUtil.makeEvaluator;
  var makeGetEvaluator = EvaluatorUtil.makeGetEvaluator;
  var makeNotEvaluator = EvaluatorUtil.makeNotEvaluator;
  var makeExpressionEvaluator = EvaluatorUtil.makeExpressionEvaluator;

  var REGEXP_1 = /^[\w\$]+((\[|\]?\.)[\w\$]+)*$/; //a[0].b.c, path
  var REGEXP_2 = /^!?[\w\$]+((\[|\]?\.)[\w\$]+)*(\(.*\))?$/; //!$.a[0].b.c(), path or func
  var REGEXP_3 = /\$((\[|\]?\.)[\w\$]+)+(?!\()/g; //$.a[0].b.c(), path on scope
  var REGEXP_4 = /^\$((\[|\]?\.)[\w\$]+)+$/; //

  function parseArgs(args, imports) { //TODO: 1, $.b, red, exec(), $.f()
    var arg, res, flag, flags, parsed;

    flags = args.flags;

    for (var i = 0, n = args.length; i < n; ++i) {
      arg = args[i];

      flag = 0; //constant
      parsed = undefined;

      parsed = LiteralUtil.parse(arg);

      if (parsed === undefined) {
        if (REGEXP_1.test(arg)) { //TODO
          flag = 1; //path
          parsed = arg.slice(2);
        } else {
          res = RES.search(arg, imports);

          if (res) {
            parsed = res;
          } else {
            flag = 2; //evaluator
            parsed = parseEvaluator(arg, imports);
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

  function parseEvaluator(expr, imports) {
    var i, j, k, l, res, path, args, evaluator;

    if (REGEXP_2.test(expr)) {
      i = expr.indexOf('!');
      j = expr.indexOf('$.');
      l = expr.indexOf('(');

      i = i === 0 ? 1 : 0;
      j = j === i ? 1 : 0;

      k = i + j * 2;

      if (l < 0) { // not function
        args = [];
        path = expr.slice(k);

        if (j) {
          res = path;
          args.flags = [1]; //TODO: EvaluatorUtil.setFlag(args, index, EvaluatorUtil.FLAG_PATH)
        } else {
          res = LiteralUtil.parse(path);

          if (res === undefined) {
            res = RES.search(path, imports);
          }
        }

        args.push(res);

        evaluator = i ? makeNotEvaluator(args) : makeGetEvaluator(args);
      } else { // function
        path = expr.slice(k, l);
        args = StringUtil_split(expr.slice(l + 1, expr.length - 1), ',', '()');

        if (args.length) {
          args = parseArgs(args, imports);
        } else {
          args = null;
        }

        if (path) {
          if (j) {
            evaluator = {
              name: path, args: args
            }
          } else {
            res = RES.search(path, imports);

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
        } else { // ${ (1, 2, $.title) } will return $.title
          evaluator = i ? makeNotEvaluator(args) : makeGetEvaluator(args);
        }
      }

      return evaluator;
    }

    return makeExpressionEvaluator(expr);
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
   * @param {string} symbol
   * @param {string} expr
   * @param {Object} imports
   * @returns {*}
   */
  function parse(symbol, expr, imports) {
    var mode = 1, tail, scopeEvent, i, j;

    switch (symbol) {
      case '$':
        mode = 1;
        break;
      case '&':
        mode = 0;
        break;
      case '#':
        mode = 2;
        break;
    }

    i = expr.lastIndexOf('@');

    if (i > expr.lastIndexOf("'")) {
      tail = expr.slice(i + 1);
      expr = expr.slice(0, i);

      scopeEvent = tail.trim();

      if (!scopeEvent) {
        scopeEvent = 'refreshed'
      }
    }


    if (mode > 0 && !scopeEvent) {
      var scopePaths = extractScopePaths(expr);// TODO: later
    }

    var piece, pieces = StringUtil_split(expr, '|', '()'),  converters, evaluator, n; //TODO

    piece = pieces[0];
    if (mode < 2) {
      evaluator = parseEvaluator(piece, imports);
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

        converters.push(parseEvaluator(piece, imports));
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

  var BINDING_SYMBOLS = {
    ONE_WAY: '$', ONE_TIME: '&', TWO_WAY: '#'
  };

  var key, symbol;

  function getBindingParser(symbol) {
    return function(config, imports) {
      return parse(symbol, config, imports);
    };
  }

  for (key in BINDING_SYMBOLS) {
    if (BINDING_SYMBOLS.hasOwnProperty(key)) {
      symbol = BINDING_SYMBOLS[key];

      ExpressionParser.registerHelper(symbol, getBindingParser(symbol));
    }
  }

  Exact.BindingParser = {
    parse: parse
  }

})();

//######################################################################################################################
// src/htmx/parsers/StyleXParser.js
//######################################################################################################################
(function() {
  'use strict';

  var StringUtil = Exact.StringUtil;
  var LiteralUtil = Exact.LiteralUtil;

  var TextStringParser = Exact.TextStringParser;
  var ExpressionParser = Exact.ExpressionParser;

  var StyleXTemplate = Exact.StyleXTemplate;

  Exact.StyleXParser = {
    /**
     * @example
     *    <div x-style="color: red; backgroundColor: &{$.bgColor | hex2rgb}; fontSize: `${$.fontSize}px`">
     *      <div x-class="btn: true; active: ${$.a > $.b}"></div>
     *    </div>
     *
     * @param {string} expr
     * @param {Object} imports
     * @param {string} type
     * @returns {StyleXTemplate}
     */
    parse: function(expr, imports, type) {// + target type, target prop
      var i, j, n, key, piece, pieces = StringUtil.split(expr, ';', '{}'), literals, expressions, expression;

      for (i = 0, n = pieces.length; i < n; ++i) {
        piece = pieces[i];

        j = piece.indexOf(':');
        key = piece.slice(0, j).trim();

        if (!key) {
          throw new Error('key should not be empty');
        }

        expression = null;
        expr = piece.slice(j+1).trim();

        if (ExpressionParser.isExpression(expr)) {
          expression = ExpressionParser.parse(expr, imports);
        } else if (TextStringParser.isStringTemplate(expr)) {
          expression = TextStringParser.parse(expr, imports);
        }

        if (expression) {
          expressions = expressions || {};
          expressions[key] = expression;
        } else {
          literals = literals || {};
          literals[key] = type ? LiteralUtil.parse(expr, type) : expr;
        }
      }

      return new StyleXTemplate(literals, expressions);
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

  var StyleXParser = Exact.StyleXParser;
  var ExpressionParser = Exact.ExpressionParser;
  var TextStringParser = Exact.TextStringParser;

  var ObjectUtil_defineProp = ObjectUtil.defineProp;

  var BLANK_REGEXP = /[\n\r\t]/g;

  var SPECIAL_KEYS  = { //TODO: x-as="title" => set('title', value), x-ask="insert[1]" => insert(value, 1), x:type, x:style
    'x-id': 'id',
    'x-as': 'as',
    //'x-on': 'actions', //TODO: remove
    'x-type': 'type',
    //'x-stay': 'stay',
    'x-attrs': 'attrs',
    'x-style': 'style',
    'x-class': 'classes'
  };

  var COMMON_TYPES = { //TODO: Exact.Constants
    'number': 'number', 'boolean': 'boolean', 'string': 'string', 'json':'json', 'contents': 'contents'//, contents
  };

  function getSpecials($template) {
    var key, x_key, specials = {};

    for (x_key in SPECIAL_KEYS) {
      if (!SPECIAL_KEYS.hasOwnProperty(x_key)) { continue; }

      key = SPECIAL_KEYS[x_key];

      if (Skin.hasAttr($template, x_key)) {
        specials[key] = Skin.getAttr($template, x_key);
        Skin.removeAttr($template, x_key);
      }
    }

    //specials.stay = 'stay' in specials;

    return specials;
  }

  function getContents($child, imports) {
    var i, n , contents = [], $contents = Skin.getChildrenCopy($child);

    for (i = 0, n = $contents.length; i < n; ++i) {
      contents.push(compile($contents[i], imports));
    }

    return contents;
  }

  function parseSpecials(node, $template, imports) {
    var specials = getSpecials($template);

    //node.stay = specials.stay;

    if (specials.id) {
      node.id = specials.id;//Skin.toCamelCase(specials.id);
    }

    if (specials.as) {
      node.as = specials.as;//Skin.toCamelCase(specials.as);
    }

    if (specials.type) {
      var type = specials.type;

      if (!(type in COMMON_TYPES)) {
        type = RES.search(type, imports);

        if (!type) {
          throw new TypeError('can not find such type');
        }
      }

      ObjectUtil_defineProp(node, 'type', {value: type});
    }

    if (specials.attrs) {
      ObjectUtil_defineProp(node, 'attrs', {value: StyleXParser.parse(specials.attrs, imports, '')}); //TODO: x-style="color: red; width: ${width | px}; height: ${height | %}"
    }

    if (specials.style) {
      ObjectUtil_defineProp(node, 'style', {value: StyleXParser.parse(specials.style, imports, '')}); //TODO: x-style="color: red; width: ${width | px}; height: ${height | %}"
    }

    if (specials.classes) {
      //TODO: Skin.getProp('className') ...
      ObjectUtil_defineProp(node, 'classes', {value: StyleXParser.parse(specials.classes, imports, 'boolean')}); //TODO: x-class="ok: true; active: ${active}"
    }

    //if (specials.actions) { //TODO: remove
    //  var value = StyleXParser.parse(specials.actions, imports, '');
    //  //fixForActions(value.expressions);
    //  ObjectUtil_defineProp(node, 'actions', {value: value}); //TODO: x-on="click: onClick; change: onChange"
    //}
  }

  function parseAttribute(node, key, expr, type, imports, isNotAttr) {
    //if (!isNotAttr) {
    //  var attributes = node.attributes; //TODO:????
    //  if (!attributes) {
    //    attributes = node.attributes = {};
    //  }
    //
    //  attributes[key] = expr;
    //}

    var literal, expression;//, expressions, attributes;
//    key = Skin.toCamelCase(key);
    if (!expr) {
      literal = true;
    } else if (ExpressionParser.isExpression(expr)) { 
      expression = ExpressionParser.parse(expr, imports);
    } else if (TextStringParser.isStringTemplate(expr)) {
      expression = TextStringParser.parse(expr, imports);
    } else {
      literal = LiteralUtil.parse(expr, type);
    }

    if (expression) {
      var expressions = node.expressions;
      if (!expressions) {
        expressions = node.expressions = {};
      }

      expressions[key] = expression;
    } else {
      var literals = node.literals;
      if (!literals) {
        literals = node.literals = {};
      }

      literals[key] = (literal !== undefined) ? literal : expr;
    }

  }

  function parseHost(node, $template, imports) {
    var i, n, $attr, $attrs;

    node.tag = Skin.getProp($template, 'tagName').toLowerCase(); //TODO: toLowerCase

    parseSpecials(node, $template, imports);

    if (!Skin.hasAttrs($template)) { return; }

    $attrs = Skin.getAttrs($template);

    for (i = 0, n = $attrs.length; i < n; ++i) {
      $attr = $attrs[i];

      parseAttribute(node, Skin.toCamelCase($attr.name), $attr.value, '', imports);
    }
  }

  function parseChildren(node, $template, imports) {
    //Skin.normalize($template);
    var i, n, key, tag, type, text = '', stay, expression, literals = node.literals,
      $child, $children = Skin.getChildrenCopy($template), child, children = [];

    for (i = 0, n = $children.length; i < n; ++i) {
      $child = $children[i];

      if (Skin.isComment($child)) { continue; }

      if (Skin.isText($child)) { // TODO: normalize text nodes
        //var data = Skin.getProp($child, 'data');
        //if (!/^\s+$/.test(data)) {
          text += Skin.getProp($child, 'data');
        //}
        continue;
      } else if (text) {
        //text = text.replace(/[\n\r\t]/g, '').replace(/[ ]{2,}/g, ' ');//TODO://
        text = text.replace(BLANK_REGEXP, '').trim();

        if (TextStringParser.isStringTemplate(text)) {
          expression = TextStringParser.parse(text, imports);
          children.push(expression);
        } else {
          children.push(text);
        }

        text = '';
      }

      child = new HTMXTemplate();

      parseHost(child, $child, imports);

      key = child.as;
      tag = child.tag;
      type = child.type;
      //stay = child.stay;

      if (key) { //TODO:
        key = Skin.toCamelCase(key);

        if (tag !== 'value' || stay) { //TODO: <value x-as="price" x-type="number">123</value>
          if (!literals) {
            literals = node.literals = {};
          }
          literals[key] = child;
        } else if (type === 'contents') { //TODO: fistChild is not text
          if (!literals) {
            literals = node.literals = {};
          }
          literals[key] = getContents($child, imports);
        } else if (!type || type in COMMON_TYPES) {
          text = Skin.getProp($child, 'textContent');
          parseAttribute(node, key, text, type, imports, true);
        }
      }

      parseChildren(child, $child, imports);

      if (!key || stay) {
        children.push(child);
      }
    }

    if (text) { //TODO: as function
      text = text.replace(BLANK_REGEXP, '').trim();
      if (TextStringParser.isStringTemplate(text)) {
        expression = TextStringParser.parse(text, imports);
        children.push(expression);
      } else {
        children.push(text);
      }
    }

    node.children = children;
  }

  function parse($template, imports) {
    var host = new HTMXTemplate();

    imports = imports || {};

    if (typeof $template === 'string') {
      $template = Skin.parse($template.trim())[0];
    }

    if (!Skin.isElement($template)) { return; }

    parseHost(host, $template, imports);
    parseChildren(host, $template, imports);

    return host;
  }

  Exact.HTMXParser = {
    parse: parse
  };

  Exact.HTMXTemplate.parse = parse;
  
})();

//######################################################################################################################
// src/more/inputs/Input.js
//######################################################################################################################
(function() {

  'use strict';

  var Skin = Exact.Skin;
  var Component = Exact.Component;

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
      this.set('checked', this.choices.indexOf(this.value) >= 0);
    },

    onChange: function() {
      this.toggle();

      //if (this.choices instanceof Array) {
        if (this.checked) {
          this.choices.push(this.value);
        } else {
          this.choices.splice(this.choices.indexOf(this.value), 1);
        }
      //}

    }
  });

  Exact.CheckBox = CheckBox;

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
  }

})(typeof global !== 'undefined' ? global : undefined, typeof module !== 'undefined' ? module : undefined);
