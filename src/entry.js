//######################################################################################################################
// src/entry.js
//######################################################################################################################
(function(global, module) {
  'use strict';

  var Exact = { version: '0.0.3' };

  if (module) {
    module.exports = Exact;
  } else {
    global = global || window || {};
    global.Exact = Exact;
    Exact.global = global;
  }

})(typeof global !== 'undefined' ? global : undefined, typeof module !== 'undefined' ? module : undefined);
