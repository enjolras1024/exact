//######################################################################################################################
// src/more/inputs/Select.js
//######################################################################################################################
(function() {

  'use strict';

  var Skin = Exact.Skin;
  var Input = Exact.Input;

  var base = Input.prototype;

  function Select() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Select, extend: Input,

    statics: {
      $template: '<select></select>'
    },

    ready: function(props) {
      base.ready.call(this, props);

      this.onChoicesChanged = this.onChoicesChanged.bind(this);

      var self = this;

      this.on('changed.contents', function() {
        self.children.reset(self.contents);
      });

      this.on('changed.choices', function() {
        self.choices.off('changed', self.onChoicesChanged);
        self.onChoicesChanged();
        self.choices.on('changed', self.onChoicesChanged);
      });
    },

    onChoicesChanged: function() {
      var i, n, $option, $options = Skin.getProp(this.$skin, 'options'), choices = this.choices;

      for (i = 0, n = $options.length; i < n; ++i) {
        $option = $options[i];
        if (choices.indexOf(Skin.getProp($option, 'value')) >= 0) {
          Skin.getShadow($option).set('selected', true);
        }
      }
    },

    onChange: function() {
      base.onChange.call(this);

      if (this.multiple && this.choices) {
        var i, n, $option, $options = Skin.getProp(this.$skin, 'options'), choices = [];

        for (i = 0, n = $options.length; i < n; ++i) {
          $option = $options[i];
          if (Skin.getProp($option, 'selected')) {
            choices.push(Skin.getProp($option, 'value') || Skin.getProp($option, 'text'));
          }
        }

        this.choices.reset(choices);
      }
    }
  });

  Exact.Select = Select;

})();
