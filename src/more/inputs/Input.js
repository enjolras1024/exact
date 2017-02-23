//######################################################################################################################
// src/more/inputs/Input.js
//######################################################################################################################
(function() {

  var Skin = Exact.Skin;
  var Component = Exact.Component;
  // TODO: add validator to value. min, max, pattern...
  function Input() {
    Component.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Input, extend: Component,

    statics: {
      $template: '<input>'
    },

    register: function() {
      this.trigger = 'change';
      this.onChange = this.onChange.bind(this);
    },

    ready: function() {
      var self = this;

      this.on(this.trigger, this.onChange);

      this.on('changed.trigger', function(evt, val, old) {
        self.off(old, self.onChange);
        self.on(val, self.onChange);
      });
    },

    //render: function() {
    //  console.log(this.hasDirty('value'), this.value);
    //  Exact.Component.prototype.render.call(this);
    //},

    onChange: function() {
      console.log('*1');
      this.set('value', Skin.getProp(this.$skin, 'value'));
    }
  });

  Exact.Input = Input;

  Exact.RES.register('Input', Input);

})();
