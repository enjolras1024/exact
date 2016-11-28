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

    mixins: [Accessor.prototype, DirtyChecker.prototype],

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
