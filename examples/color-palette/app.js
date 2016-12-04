var Skin = Exact.Skin;
var Component = Exact.Component;

function ChannelEditor() {
  Component.apply(this, arguments);
}

Exact.defineClass({
  constructor: ChannelEditor, extend: Component,
  statics: {
    $template: Skin.query(document, '.template .channel-editor')
  },
  onSlide: function() {
    this.set('value', Skin.getProp(this.slider.$skin, 'value'));
  },
  onChange: function() {
    var value = Number(Skin.getProp(this.slider.$skin, 'value'));
    if (!isNaN(value)) {
      this.set('value', value);
    }
  },
  register: function() {
    Exact.help(this).bind('onChange', 'onSlide');
  }
});

function cut(key) {
  return function (value, props) {
    value = Number(value);

    value = value >= 0 ? value : 0;
    value = value <= 255 ? value : 255;

    props[key] = value;
  }
}

function hex2dec(n) {
  var s = Number(n).toString(16);
  return  s.length > 1 ? s : '0' + s;
}

function dec2hex(s) {
  return Number('0x' + s);
}

function Palette() {
  Component.apply(this, arguments);
}

Exact.defineClass({
  constructor: Palette, extend: Component,
  statics: {
    $template: Skin.query(document, '.template .palette'),
    resources: {
      ChannelEditor: ChannelEditor
    },
    descriptors: [{
      red: {
        set: cut('red')
      },
      blue: {
        set: cut('blue')
      },
      green: {
        set: cut('green')
      },
      color: {
        validator: /^\s*#[0-9a-fA-F]{6}\s*$/,
        depends: ['red', 'green', 'blue'],
        get: function(props) {
          return '#' + hex2dec(this.red) + hex2dec(this.green) + hex2dec(this.blue);
        },
        set: function(value, props) {
          value = value.slice(1); // delete '#'
          this.set('red', dec2hex(value.slice(0, 2)));
          this.set('green', dec2hex(value.slice(2, 4)));
          this.set('blue', dec2hex(value.slice(4, 6)));
        }
      }
    }]
  },
  defaults: function() {
    return {
      red: 0,
      blue: 0,
      green: 0
    }
  },
  register: function() {
    Exact.help(this).bind('onChange');
  },
  ready: function() {
    var self = this;
    this.on('validated.color', function(event, error) {
      self.set('isInvalid', !!error);
    });
  },
  onChange: function() {
    this.set('color', Skin.getProp(this.input.$skin, 'value'));
  }
});

document.getElementById('app-shell').appendChild(Component.create(Palette).$skin);