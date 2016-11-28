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
