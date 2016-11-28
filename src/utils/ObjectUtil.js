//######################################################################################################################
// src/utils/ObjectUtil.js
//######################################################################################################################
(function() {
  'use strict';

  var features = {};

  features.seal = 'seal' in Object;
  features.freeze = 'freeze' in Object;

  try {
    Object.defineProperty({}, 'x', {get: function() {}, set: function() {}});
    features.accessor = true;
  } catch (error) {
    features.accessor = false;
  }

  function getDescriptor(object, key) {
    return {value: object[key]};
  }

  function defineProp(object, key, desc) {
    if (!desc || typeof desc !== 'object') {
      throw new Error('');
    }

    object[key] = desc.value;
  }

  function assign(target/*,..sources*/) {
      if (target === undefined || target === null) {
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
            defineProp(target, key, getDescriptor(source, key));
          }
        }
      }

      return target;
    }

  /**
   * Clone a object.
   *
   * @param {Object} source
   * @param {number} depth
   * @returns {Object}
   */
  function clone(source, depth) {
    if (depth === undefined) {
      depth = -1; // clone completely
    }

    var key, target, constructor;

    if (!(source instanceof Object) || !source || !depth) {
      return source;
    }

    if (typeof source === 'function') {
      target = function() { return source.apply(this, arguments); };
    } else {
      constructor = source.constructor;

      target = new constructor();

      for (key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = clone(source[key], depth - 1);
        }
      }
    }

    return target;
  }

  var Array$push = Array.prototype.push;
  var Array$splice = Array.prototype.splice;
  var Array$unshift = Array.prototype.unshift;

  var UPDATE_COMMANDS = { //TODO: as outer const
    '$set': true, '$push': true, '$unshift': true, '$splice': true, '$apply': true, '$assign': true
  };

  /**
   * Update some parts of a object.
   *
   * @example update({items: [1,2,3]}, {items: {$push: [4]}})
   *
   * @param {Object} source
   * @param {Object} specs
   * @returns {Object}
   */
  function update(source, specs) {
//      if (!(source instanceof Object) || !source) {
//        return source;
//      }
    if (typeof specs !== 'object' || !specs) { return; }

    if (specs.hasOwnProperty('$set')) { //$equal
      return specs['$set'];
    }

    var key, target = clone(source, 1);

    if (specs.hasOwnProperty('$assign')) {
      assign(target, specs['$assign']);
    } else if (specs.hasOwnProperty('$push')) {
      Array$push.apply(target, specs['$push']); //TODO: push as outer func
    } else if (specs.hasOwnProperty('$unshift')) {
      Array$unshift.apply(target, specs['$unshift']); //TODO: unshift as outer func
    } else if (specs.hasOwnProperty('$splice')) {
      Array$splice.apply(target, specs['$splice']); //TODO: unshift as outer func
    } else if (specs.hasOwnProperty('$apply')) {
      target = specs['$apply'](target);
    }

    for (key in specs) {
      if (specs.hasOwnProperty(key) && !UPDATE_COMMANDS.hasOwnProperty(key)) {
        target[key] = update(source[key], specs[key]);
      }
    }

    return target;
  }

  Exact.ObjectUtil = {
    assign: Object.assign || assign,

    defineProp: features.accessor ? Object.defineProperty : defineProp,

    getDescriptor: Object.getOwnPropertyDescriptor || getDescriptor,

    update: update,

    clone: clone,

    support: function support(name) {
      return features[name];
    }
  };

})();
