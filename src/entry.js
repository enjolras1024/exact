//######################################################################################################################
// src/entry.js
//######################################################################################################################
(function(global, module) {
  'use strict';

  var Exact = { version: '0.0.8' };

  global = global || window || {};

  if (module) {
    module.exports = Exact;
  } else {
    global.Exact = Exact;
  }

  Exact.global = global;

})(typeof global !== 'undefined' ? global : null, typeof module !== 'undefined' ? module : null);
