//######################################################################################################################
// src/utils/StringUtil.js
//######################################################################################################################
(function() {

  'use strict';

  var QUOTE_CODE = "'".charCodeAt(0);
  var SPACE_CODE = ' '.charCodeAt(0);
  var SLASH_CODE = '\\'.charCodeAt(0);
  
  Exact.StringUtil = {
    /**
     * Split a string. If the delimiter appears in '' or brackets, it will be ignored. 
     * Each piece of string will be trimmed.
     * 
     * @param {string} expression
     * @param {string} delimiter
     * @param {string} brackets
     * @returns {Array}
     */
    split: function split(expression, delimiter, brackets) {
      var i = -1, l = -1, r = -1, n, cc, cb, cl, cr, ct, iq, piece, pieces = [];

      expression = expression.trim();

      if (expression[expression.length - 1] !== delimiter) {
        expression += delimiter;
      }

      n = expression.length;

      if (n === 1) {
        return pieces;
      }

      l = 0;
      delimiter = delimiter.charCodeAt(0);
      brackets = [brackets.charCodeAt(0), brackets.charCodeAt(1)];

      while (++i < n) {

        cc = expression.charCodeAt(i);
        
        if (cc === SPACE_CODE) {
          cb = cc;
          continue;
        }

        if (cc === QUOTE_CODE && cb !== SLASH_CODE) {
          cb = cc;
          iq = !iq;
          continue;
        }
        
        if (!ct) {
          cl = -1;
          cr = -1;

          if (cc === brackets[0] && !iq) {
            cl = cc;
            cr = brackets[1];
            ct = 1;
          }
        } else {
          if (cc === cr) {
            --ct;
          } else if (cc === cl) {
            ++ct;
          }
        }

        if (!iq && !ct && cc === delimiter) {
          piece = expression.slice(l, i).trim();
          if (!piece) {
            throw new Error('Illegal argument list');
          }
          pieces.push(piece);
          l = i+1;
        }

        cb = cc;

      }

      return pieces;
    }
  };

})();
