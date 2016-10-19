//######################################################################################################################
// src/more/inputs/Select.js
//######################################################################################################################
(function() {

  'use strict';

  var List = Exact.List;
  var Input = Exact.Input;

  var base = Input.prototype;

  function Select() {
    List.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Select, extend: List,

    statics: {
      $template: '<select></select>'
    },

    onChange: base.onChange,

    register: base.register,

    ready: base.ready
  });

  Exact.Select = Select;

})();
