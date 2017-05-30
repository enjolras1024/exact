//######################################################################################################################
// src/share/RES.js
//######################################################################################################################
(function() {

  var PathUtil = Exact.PathUtil;

  /**
   * Find the resource in the scope
   *
   * @param {Array} path
   * @param {Object} scope
   * @returns {*}
   */
  function find(path, scope) {
    var i = -1, n = path.length, value = scope;

    while (++i < n) {
      value = value[path[i]];
      if (value === undefined || value === null) {
        return value;
      }
    }

    return value;
  }

  Exact.RES = {
    /**
     * Find the resource in local, then in RES if necessary.
     *
     * @param {Array|string} path
     * @param {Object} local
     * @param {boolean} stop
     * @returns {*}
     */
    search: function(path, local, stop) {
      if (typeof path === 'string') {
        path = PathUtil.parse(path);
      }

      if (local) {
        var res = find(path, local);
      }

      if (!res && !stop) {
        res = find(path, this);

        if (!res && Exact.global) {
          res = find(path, Exact.global);
        }
      }

      return res;
    },

    /**
     *
     * @param {string|Array} path
     * @param {*} value
     * @param {boolean} override
     * @returns {boolean}
     */
    register: function(path, value, override) {
      var temp, target = this;

      if (typeof path === 'string') {
        path = PathUtil.parse(path);
      }

      var i = -1, n = path.length - 1;

      while (++i < n) {
        temp = target[path[i]];

        if (temp == null) { // null or undefined
          temp = target[path[i]] = {};
        } else if (!(temp instanceof Object)) {
          throw new TypeError('You can not register resource to ' + typeof temp);
        }

        target = temp;
      }

      var prop = path[i];

      if (!override && target.hasOwnProperty(prop)) {
        if ('__DEV__' === 'development') {
          console.warn('the resource on path `' + path.join('.') + '` already exists');
        }
        return false;
      }

      Exact.defineProp(target, prop, {
        value: value, writable: false, enumerable: true, configurable: true
      });

      return true;
    }
  };

})();
