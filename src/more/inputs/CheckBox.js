//######################################################################################################################
// src/more/inputs/CheckBox.js
//######################################################################################################################
(function() {

  'use strict';

  var Input = Exact.Input;

  var base = Input.prototype;

  function CheckBox() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: CheckBox, extend: Input,

    statics: {
      $template: '<input type="checkbox">'
    },

    ready: function(props) {
      base.ready.call(this, props);

      this.onChoicesChanged = this.onChoicesChanged.bind(this);

      var self = this;
      this.on('changed.choices', function() {
        self.choices.off('changed', self.onChoicesChanged);
        self.onChoicesChanged();
        self.choices.on('changed', self.onChoicesChanged);
      });
    },

    toggle: function() {
      this.set('checked', !this.checked);
    },

    onChoicesChanged: function() {
      this.set('checked', this.choices.indexOf(this.value) >= 0);
    },

    onChange: function() {
      this.toggle();

      //if (this.choices instanceof Array) {
        if (this.checked) {
          this.choices.push(this.value);
        } else {
          this.choices.splice(this.choices.indexOf(this.value), 1);
        }
      //}

    }
  });

  Exact.CheckBox = CheckBox;

})();
