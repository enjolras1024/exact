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
