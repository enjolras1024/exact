//######################################################################################################################
// src/more/inputs/Select.js
//######################################################################################################################
(function() {

  'use strict';

  var Skin = Exact.Skin;
  var Input = Exact.Input;
  //var Component = Exact.Component;

  var base = Input.prototype;

  function Select() {
    Input.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Select, extend: Input, //TODO: List

    statics: {
      $template: '<select></select>'
    },

    ready: function(props) {
      base.ready.call(this, props);

      this.onChoicesChanged = this.onChoicesChanged.bind(this);

      var self = this;

      this.contents.on('changed', function() {
        self.children.reset(self.contents);
      });

      this.on('changed.choices', function() {
        self.choices.off('changed', self.onChoicesChanged);
        self.onChoicesChanged();
        self.choices.on('changed', self.onChoicesChanged);
      });
    },

    onChoicesChanged: function() {
      //this.set('checked', this.choices.indexOf(this.value) >= 0);
      var i, n, child, children = this.children, choices = this.choices;

      for (i = 0, n = children.length; i < n; ++i) {
        child = children[i];
        if (choices.indexOf(child.value) >= 0) {
          Skin.setProp(child.$skin, 'selected', true);
        }
      }
    },

    onChange: function() {
      base.onChange.call(this);

      if (this.multiple && this.choices) {
        var i, n, $child, child, children = this.children, choices = [];

        for (i = 0, n = children.length; i < n; ++i) {
          child = children[i];
          $child = child.$skin;
          if (Skin.getProp($child, 'selected')) {
            choices.push(child.value || Skin.getProp(child, 'textContent'));
          }
        }

        this.choices.reset(choices);
      }
    }
  });

  Exact.Select = Select;

})();
