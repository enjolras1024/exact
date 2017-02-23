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
