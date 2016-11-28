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
      //if (typeof expectedTypes[i] === 'function') {
      //  str += expectedTypes[i].name;
      //} else {
      //  str += expectedTypes[i].name;
      //}
      types.push('`' + (expectedTypes[i].name || expectedTypes[i]) + '`');
    }

    return new TypeError('`' + propertyName + '` of type `' + (constructorName || '<<anonymous>>') +
      '` should be ' + types.join(' or ') + (actualType ? ', not `' + actualType : '') + '`');
  }

  /**
   * Validate the type of the value when the key is set in accessor.
   *
   * @param {Accessor} accessor
   * @param {string} key
   * @param {*} value
   * @param {string|Function} type
   * @returns {TypeError}
   */
  function validateType(accessor, key, value, type) {
    if (value === undefined) { return; } //TODO: required ?

    var t1 = typeof type, t2, error, constructor;

    //t2 = typeof value;
    if (t1 === 'string' && typeof value !== type) { //TODO: type can be array
//    if (t1 === 'string' && !TYPE_REGEXPS[t2].test(type)) {
      t1 = type;
      error = true;
    } else if (t1 === 'function' && !(value instanceof type)) {
      t1 = type.fullName || type.name;
      error = true;
    }

    if (error) {
      constructor = accessor.constructor;
      return makeTypeError(constructor.fullName || constructor.name, key, t1, getType(value));
    } else if (Array.isArray(type)) {
      for (var i = 0, n = type.length; i < n; ++i) {
        t1 = typeof type[i];
        if ((t1 === 'string' && typeof value === type[i]) || (t1 === 'function' && value instanceof type[i])) {
          break;
        }
      }

      if (i === n) {
        constructor = accessor.constructor;
        return makeTypesError(constructor.fullName || constructor.name, key, type, getType(value));
      }
    }
  }

  function validatePattern(accessor, key, value, pattern) {
    if (!pattern.test(value)) {
      return new Error(value, 'does not match the pattern ' + pattern.toString());
    }
  }

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

          //var t = typeof desc;
          //
          //if (t === 'string' || t === 'function') { // Like {name: 'string', role: Student} where Student is constructor
          //  type = desc;
          //} else if (t === 'object') {
            type = desc.type;
            pattern = desc.pattern;
          //} else {
          //  return true; //TODO: type: ['string', 'number', Date]
          //}
//        required = desc.required; //TODO: coerce
          validate = desc.validate;

          if (!error && type) {
            error = validateType(accessor, key, value, type);
          }

          if (!error && pattern) {
            error = validatePattern(accessor, key, value, pattern);
          }

          if (!error && typeof validate === 'function') {
            error = validate.call(accessor, value, key);
          }

          if (error) {
            //if (__DEV__ === 'development') {
            //  console.warn('Invalid:', error.message);
            //}

            if (accessor.on && accessor.send) {
              accessor.send('invalid.' + key, error);
            }

            return false;
          }
        }

        return true;
      }
    }
  });



  Exact.Validator = Validator;

})();
