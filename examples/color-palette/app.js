(function() {
  var Component = Exact.Component;

  function ChannelEditor() {
    Component.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: ChannelEditor, extend: Component,

    statics: {
      descriptors: ['label', 'value'],
      template: Exact.Skin.query('.template .channel-editor')
    },

    register: function() {
      Exact.help(this).bind('onChange', 'onSlide');
    },

    onChange: function(event) {
      var value = Number(event.target.value);
      if (!isNaN(value)) {
        this.set('value', value);
      }
    },

    onSlide: function(event) {
      this.set('value', event.target.value);
    }
  });

  function clip(value) {
    value = Number(value);
    return value < 0 ? 0 : (value > 255 ? 255 : value);
  }

  function dec2hex(n) {
    var s = Number(n).toString(16);
    return  s.length > 1 ? s : '0' + s;
  }

  function hex2dec(s) {
    return Number('0x' + s);
  }

  function Palette() {
    Component.apply(this, arguments);
  }

  Exact.defineClass({
    constructor: Palette, extend: Component,

    statics: {
      template: Exact.Skin.query('.template .palette'),

      resources: {
        ChannelEditor: ChannelEditor
      },

      descriptors: {
        red: {
          coerce: clip
        },
        blue: {
          coerce: clip
        },
        green: {
          coerce: clip
        },
        color: {
          validator: /^\s*#[0-9a-fA-F]{6}\s*$/,
          depends: ['red', 'green', 'blue'],
          get: function() {
            return '#' + dec2hex(this.red) + dec2hex(this.green) + dec2hex(this.blue);
          },
          set: function(value) {
            this.set('red', hex2dec(value.slice(1, 3)));
            this.set('green', hex2dec(value.slice(3, 5)));
            this.set('blue', hex2dec(value.slice(5, 7)));
          }
        }
      },

      defaults: function() {
        return {
          red: 0,
          blue: 0,
          green: 0,
          isInvalid: false
        }
      }
    },

    register: function() {
      Exact.help(this).bind('onChange');

      this.on('validated.color', (function(event, error) {
        this.set('isInvalid', !!error);
      }).bind(this));
    },

    onChange: function(event) {
      this.set('color', event.target.value);
    }
  });

  Component.create(Palette).attach(Exact.Skin.query('#palette'));
})();