//######################################################################################################################
// src/more/inputs/CheckBox.js
//######################################################################################################################
(function() {

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
      if (this.choices) {
        this.set('checked', this.choices.indexOf(this.value) >= 0);
      }
    },

    onChange: function() {
      this.toggle();

      var choices = this.choices;

      if (choices) {
        if (this.checked) {
          choices.push(this.value);
        } else {
          choices.splice(choices.indexOf(this.value), 1);
        }
      }

    }
  });

  Exact.CheckBox = CheckBox;

  Exact.RES.register('CheckBox', CheckBox);

})();
