var Component = Exact.Component;
var Skin = Exact.Skin;

function Slider() {
  Component.apply(this, arguments);
}

Exact.defineClass({
  constructor: Slider, extend: Component,
  statics: {
    defaults: function() {
      return {
        min: 0,
        max: 10,
        value: 0
      };
    },
    template: Skin.query(document, '.template .slider')
  },
  onMouseChange: function(event) {
    switch (event.type) {
      case 'mousemove':
        if (this.pressed) {
          var max = Number(this.max);
          var min = Number(this.min);
          //var cx = event.clientX - this.$skin.getBoundingClientRect().left;
          var cx = event.clientX - Skin.call(this.$skin, 'getBoundingClientRect').left;
          cx = cx < 0 ? 0 : cx;
          cx = cx > 100 ? 100 : cx;
          this.set('value', (cx * 0.01 * (max - min) + min).toFixed(1));
        }
        break;
      case 'mousedown':
        this.pressed = true;
        break;
      case 'mouseup':
        this.pressed = false;
        break;
    }
  },

  register: function() {
    Exact.help(this).bind('onMouseChange');
  },
  ready: function() {

    var body = document.body;
    body.addEventListener('mousemove', this.onMouseChange);
    body.addEventListener('mouseup', this.onMouseChange);

    var self = this;
    this.on('changed', function(event) {
      if (event.keyName !== 'value') {
        var value = self.value;
        value = value < self.min ? self.min : value;
        value = value > self.max ? self.max : value;
        self.set('value', value);
      }
    });
  },
  normalize: function(value) {
    return (value - this.min) / (this.max - this.min) * 100;
  }
});

function TextSlider() {
  Component.apply(this, arguments);
}

Exact.defineClass({
  constructor: TextSlider, extend: Component,
  statics: {
    template: Skin.query(document, '.template .text-slider'),
    resources: {
      Slider: Slider
    },
    defaults: function() {
      return {
        min: 0,
        max: 10,
        value: 0,
        label: ''
      };
    }
  }

});

function App() {
  Component.apply(this, arguments);
}

Exact.defineClass({
  constructor: App, extend: Component,
  statics: {
    template: Skin.query(document, '.template .app'),
    resources: {
      TextSlider: TextSlider
    }
  }
});

Component.create(App).attach(Skin.query(document, '#app'));