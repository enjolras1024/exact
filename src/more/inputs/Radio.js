//######################################################################################################################
// src/more/inputs/Radio.js
//######################################################################################################################
(function() {

  'use strict';

  var Input = Exact.Input;

  var base = Input.prototype;

  function Radio() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Radio, extend: Input,

    statics: {
      $template: '<input type="radio">'
    },

    ready: function(props) {
      base.ready.call(this, props);

      this.onChangedChoice = this.onChangedChoice.bind(this);
      this.on('changed.choice', this.onChangedChoice);
    },

    toggle: function() {
      this.set('checked', !this.checked);
    },

    onChangedChoice: function() {
      this.set('checked',  this.choice === this.value);
    },

    onChange: function() {
      this.toggle();
      if (this.checked) {
        this.set('choice', this.value);
      }
    }
  });

  Exact.Radio = Radio;

})();
