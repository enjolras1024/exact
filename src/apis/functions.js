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
