//######################################################################################################################
// src/core/shadows/Text.js
//######################################################################################################################
(function() {
  'use strict';

  var Shadow = Exact.Shadow;
  //var hasDirty = Exact.DirtyChecker.hasDirty;

  function Text(data) {
    Text.initialize(this, data);
  }

  Exact.defineClass({
    constructor: Text,

    extend: Shadow,

    statics: {

      create: function(data) {
        var text = new Text();
        text.set('data', data);//TODO: nodeValue, content

        return text;
      },

      release: function release(text) {
        Shadow.clean(text);
      },

      initialize: function(text, data) {
        Shadow.initialize(text, {data: data}, '');
        //Shadow.initialize(text, 'TEXT', {data: data});
      }
    },

    toString: function() {
      return '"' + this.data + '"(' + this.guid +')'; //TODO: content
    }

  });

  Exact.Text = Text;

})();
