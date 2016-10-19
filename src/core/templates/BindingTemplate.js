//######################################################################################################################
// src/core/templates/BindingTemplate.js
//######################################################################################################################
(function() {

  'use strict';

  var Binding = Exact.Binding;

  function BindingTemplate() {
    this.mode = 0;
    this.evaluator = null; //this.expressions = null;
    this.converters = null;
    this.scopePaths = null;
    this.scopeEvent = null;
  }

  BindingTemplate.compile = function(template, property, target, scope) {
    Binding.build(target, property, scope, template);
  };

  Exact.BindingTemplate = BindingTemplate;

})();
