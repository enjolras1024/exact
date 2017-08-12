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
          Exact.defineProp(target, '_bindings', {
            value: [binding], writable: false, enumerable: false, configurable: true
          });
        }
      },

      remove: function remove(target, binding) {
        var _bindings = target._bindings;

        if (_bindings && _bindings.length) {
          _bindings.splice(_bindings.lastIndexOf(binding), 1);
        }
      }
    }
  });

  Exact.Binding = Binding;

})();
