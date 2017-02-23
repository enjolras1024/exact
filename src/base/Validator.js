//######################################################################################################################
// src/base/Validator.js
//######################################################################################################################
(function() {

  function getType(value) {
    if (value instanceof Object) {
      var constructor = value.constructor;
      return  constructor.fullName || constructor.name;
    }

    return typeof value;
  }

  function makeTypeError(constructorName, propertyName, expectedType, actualType) {
    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be `' + expectedType + (actualType ? '`, not `' + actualType : '') + '`');
  }

  function makeTypesError(constructorName, propertyName, expectedTypes, actualType) {
    var types = [];
    for (var i = 0, n = expectedTypes.length; i < n; ++i) {
      types.push('`' + (expectedTypes[i].name || expectedTypes[i]) + '`');
    }

    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be ' + types.join(' or ') + (actualType ? ', not `' + actualType : '') + '`');
  }

  /**
   * Validate the type of the value when the key is set in target.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {string|Function} type
   * @returns {TypeError}
   */
  function validateType(target, key, value, type) {
    var t = typeof type, error, constructor;

    if (t === 'string' && typeof value !== type) { //TODO: type can be array
      t = type;
      error = true;
    } else if (t === 'function' && !(value instanceof type)) {
      t = type.fullName || type.name;
      error = true;
    }

    if (error) {
      constructor = target.constructor;
      return makeTypeError(constructor.fullName || constructor.name, key, t, getType(value));
    } else if (Array.isArray(type)) {
      for (var i = 0, n = type.length; i < n; ++i) {
        t = typeof type[i];
        if ((t === 'string' && typeof value === type[i]) || (t === 'function' && value instanceof type[i])) {
          break;
        }
      }

      if (i === n) {
        constructor = target.constructor;
        return makeTypesError(constructor.fullName || constructor.name, key, type, getType(value));
      }
    }
  }

  /**
   * Validate if the value matches the pattern.
   *
   * @param {Object} target
   * @param {string} key
   * @param {*} value
   * @param {RegExp} pattern
   * @returns {Error}
   */
  function validatePattern(target, key, value, pattern) {
    if (!pattern.test(value)) {
      return new Error(value + ' does not match the pattern ' + pattern.toString() +
        ' of the property `' + key + '` in ' +  target.toString());
    }
  }

  /**
   * Validator provides the `validate()` method.
   *
   * @example A constructor has descriptors:
   *
   *  {
   *    name: 'string',
   *    list: Array,
   *    date: {
   *      type: [Date, 'number', 'string]
   *    },
   *    phone: {
   *      validator: /\d{13}/
   *    },
   *    price: {
   *      type: 'number',
   *      validator: function() {...} // returns error or not
   *    }
   *  }
   *
   *
   * @static
   * @constructor
   */
  Exact.Validator = {
    /**
     * Validate the value when the key is set in target.
     *
     * @param {Object} target
     * @param {string} key
     * @param {*} value
     * @param {Object} desc   - descriptor
     * @returns {boolean}
     */
    validate: function validate(target, key, value, desc) {
      if (!desc.type && !desc.validator) { return true; }

      var error, validator, type, validated;

      type = desc.type;
      //required = desc.required;
      validator = desc.validator;

      if (/*!error && */type) {
        validated = true;
        error = validateType(target, key, value, type);
      }

      if (!error && validator) {
        validated = true;
        if (typeof validator === 'function') {
          error = validator.call(target, value, key);
        } else {
          error = validatePattern(target, key, value, validator);
        }
      }

      if (validated && target.on && target.send) {
        target.send('validated.' + key, error);
      }

      if (error) {
        if ('__DEV__' === 'development') {
          console.warn('Invalid:', error.message);
        }
        return false;
      }

      return true;
    }
  };

})();
