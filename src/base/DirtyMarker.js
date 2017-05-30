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

          Exact.defineProp(object, '_dirty', {
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
