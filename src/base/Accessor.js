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
