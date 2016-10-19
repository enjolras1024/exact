//######################################################################################################################
// src/utils/LiteralUtil.js
//######################################################################################################################
(function() {

  'use strict';

  /**
   * @constant
   */
  var SPECIAL_VALUES = {
    'true': true,
    'false': false,
    'NaN': NaN,
    'null': null,
    'undefined': undefined
  };

  function toSpecial(expr) {
    return SPECIAL_VALUES[expr];
  }

  function toAnyValue(expr) {
    try {
      return JSON.parse(expr);
    } catch (error) {}
  }

  function toBoolean(expr) {
    return !!parse(expr);
  }

  function toNumber(expr) {
    return Number(expr);
  }

  function toString(expr) {
    return expr;
  }

  //string in single quotes
  function toStrISQ(expr) {
    var i = expr.indexOf("'");
    var j = expr.lastIndexOf("'");

    return expr.slice(i+1, j);
  }

  function toJSON(expr) {
    return toAnyValue(expr) || null;
  }

  var typedParsers = {
    'boolean': toBoolean,
    'number': toNumber,
    'string': toString,
    'json': toJSON
  };

  var STRING_IN_SINGLE_QUOTES_REGEXP = /^'.*'$/;
  //var JSON_LIKE_REGEXP = /(^\[.*\]$)|(^\{.*\}$)/;
  //var JSON_LIKE_REGEXP = /(^\[(\s*"\S+"\s*:)+.*\]$)|(^\{("\S+":)+.*\}$)/;

  /**
   * Parse possible value from expression.
   *
   * @param {string} expr
   * @param {string} type
   * @returns {*}
   */
  function parse(expr, type) {
    if (typeof expr !== 'string') {
      throw new TypeError('expr must be string');
    }

    expr = expr.trim();

    if (type && typeof type === 'string') {
      if (!(type in typedParsers)) {
        throw new Error('no such type of literal parser, try on json');
      }
      return typedParsers[type](expr);
    }

    if (SPECIAL_VALUES.hasOwnProperty(expr)) {
      return toSpecial(expr);//SPECIAL_VALUES[expr];
    } else if (!isNaN(expr)) {
      return toNumber(expr);//Number(expr);
    } else if (STRING_IN_SINGLE_QUOTES_REGEXP.test(expr)) {
      return toStrISQ(expr);
    } else /*if (JSON_LIKE_REGEXP.test(expr))*/ {
      return toAnyValue(expr);
    }
    //else, return undefined
  }

  Exact.LiteralUtil = {

    parse: parse,

    toNumber: toNumber,

    toBoolean: toBoolean,

    toAnyValue: toAnyValue
  };

})();
