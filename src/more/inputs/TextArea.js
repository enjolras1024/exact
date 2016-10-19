//######################################################################################################################
// src/more/inputs/TextArea.js
//######################################################################################################################
(function() {

  'use strict';

  var Input = Exact.Input;

  function TextArea() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: TextArea, extend: Input,

    statics: {
      $template: '<textarea></textarea>'
    }
  });

  Exact.TextArea = TextArea;

})();
