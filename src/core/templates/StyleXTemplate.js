//######################################################################################################################
// src/core/templates/StyleTemplate.js
//######################################################################################################################
(function() {
  
  'use strict';

  var ObjectUtil_assign = Exact.ObjectUtil.assign;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

  function StyleXTemplate(literals, expressions) {
    this.literals = literals;
    this.expressions = expressions; //this.expressions = null;

    //ObjectUtil_assign(this, literals);
    //ObjectUtil_defineProp(this, 'expression', {value: expressions});
  }

  Exact.StyleXTemplate = StyleXTemplate;

})();