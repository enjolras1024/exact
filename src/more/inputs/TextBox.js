//######################################################################################################################
// src/more/inputs/TextBox.js
//######################################################################################################################
(function() {

  var Input = Exact.Input;

  function TextBox() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: TextBox, extend: Input,

    statics: {
      $template: '<input type="text">'
    }
  });

  Exact.TextBox = TextBox;

  Exact.RES.register('TextBox', TextBox);

})();
