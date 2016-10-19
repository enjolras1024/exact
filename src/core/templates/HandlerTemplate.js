//######################################################################################################################
// src/core/bindings/EventBinding.js
//######################################################################################################################
(function() {

  'use strict';

  function HandlerTemplate() {
    this.exec = null;
    this.name = '';
  }

  HandlerTemplate.compile = function(template, event, target, scope) {
    var exec = template.exec, name = template.name;

    if (!exec) {
      exec = scope[name];
    }

    target.on(event, exec.bind(scope));
  };

  Exact.HandlerTemplate = HandlerTemplate;

})();
