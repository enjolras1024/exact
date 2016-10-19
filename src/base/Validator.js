//######################################################################################################################
// src/base/Validator.js
//######################################################################################################################
(function() {

  'use strict';

  var TYPE_REGEXPS = {
    number: /\bnumber\b/,
    string: /\bstring\b/,
    boolean: /\bboolean\b/
  };

  /**
   * Validator provides the `validate()` method.
   *
   * @example A constructor has descriptors:
   *
   *  { name: 'string', role: Student, age: {type: 'number', validate: validateRange} }
   *
   * The validator can check if the type of `name` is 'string', `role` is an instance of Student, and `age` is number
   * in the legal range.
   *
   * @static
   * @constructor
   */
  function Validator() {
    throw new Error('Validator is static class');
  }

  Exact.defineClass({

    constructor: Validator,

    statics: {
      /**
       * Validate the value when the key is set in accessor.
       *
       * @param {Accessor} accessor
       * @param {string} key
       * @param {*} value
       * @param {Object} descriptors
       * @returns {boolean}
       */
      validate: function validate(accessor, key, value, descriptors) {
        var error, validate, pattern, type, desc;//, descriptors = constructor._descriptors_;

        if (descriptors && descriptors.hasOwnProperty(key)) {
          desc = descriptors[key]; //TODO: descriptions[key]

          if (!desc) { return true; }

          var t = typeof desc;

          if (t === 'string' || t === 'function') { // Like {name: 'string', role: Student} where Student is constructor
            type = desc;
          } else if (t === 'object') {
            type = desc.type;
            pattern = desc.pattern;
          } else {
            return true;
          }
//        required = desc.required; //TODO: coerce
          validate = desc.validate;

          if (!error && type) {
            error = Validator.validateType(accessor, key, value, type);
          }

          if (!error && pattern) {
            error = Validator.validatePattern(accessor, key, value, pattern);
          }

          if (!error && typeof validate === 'function') {
            error = validate.call(accessor, value, key);
          }

          if (error) {
            if (__DEV__ === 'development') {
              console.warn('Invalid:', error.message);
            }

            if (accessor.on && accessor.send) {
              accessor.send('invalid.' + key, error);
            }

            return false;
          }
        }

        return true;
      },

      /**
       * Validate the type of the value when the key is set in accessor.
       *
       * @param {Accessor} accessor
       * @param {string} key
       * @param {*} value
       * @param {string|Function} type
       * @returns {TypeError}
       */
      validateType: function validateType(accessor, key, value, type) {
        if (value === undefined) { return; } //TODO: required ?

        var t1 = typeof type, t2, error, constructor;

        t2 = typeof value;
//      if (t1 === 'string' && (t2 = typeof value) !== type) {
        if (t1 === 'string' && !TYPE_REGEXPS[t2].test(type)) {
          t1 = type;

          error = true;
        } else if (t1 === 'function' && !(value instanceof type)) {
          t1 = type.fullName || type.name;

          constructor = value.constructor;
          t2 = constructor.fullName || constructor.name;

          error = true;
        }

        if (error) {
          constructor = accessor.constructor;

          return makeTypeError(constructor.fullName || constructor.name, key, t1, t2);
        }
      },

      validatePattern: function validatePattern(accessor, key, value, pattern) {
        if (!pattern.test(value)) {
          return new Error(value, 'does not match the pattern ' + pattern.toString());
        }
      }
    }
  });

  function makeTypeError(constructorName, propertyName, expectedType, actualType) {
    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be `' + expectedType + (actualType ? '`, not `' + actualType : '') + '`');
  }

  Exact.Validator = Validator;

})();
