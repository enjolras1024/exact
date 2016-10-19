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
