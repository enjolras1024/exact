//######################################################################################################################
// src/core/shadows/Text.js
//######################################################################################################################
(function() {

  var Shadow = Exact.Shadow;

  function Text(data) {
    Text.initialize(this, data);
  }

  Exact.defineClass({
    constructor: Text, extend: Shadow,

    statics: {

      create: function(data) {
        return new Text(data);
      },

      initialize: function(text, data) {
        if ('__DEV__' === 'development') {
          if (text.constructor !== Text) {
            throw new TypeError('Text is final class and can not be extended');
          }
        }

        Shadow.initialize(text, '', '');

        text.set('data', data || '');
      }
    },

    toString: function() {
      return '"' + (this.data.length < 24 ? this.data : (this.data.slice(0, 21) + '...'))  + '"(' + this.guid +')';
    }

  });

  Exact.Text = Text;

})();
