//######################################################################################################################
// src/core/templates/StyleTemplate.js
//######################################################################################################################
(function() {

  'use strict';

  var ObjectUtil_assign = Exact.ObjectUtil.assign;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

  function PropsTemplate(literals, expressions) {
    ObjectUtil_assign(this, literals);
    ObjectUtil_defineProp(this, 'expressions', {
      value: expressions, writable: true, enumerable: false, configurable: true
    });
  }

  Exact.PropsTemplate = PropsTemplate;

})();
