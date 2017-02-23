//######################################################################################################################
// src/core/models/Container.js
//######################################################################################################################
(function() {

  var Accessor = Exact.Accessor;
  var DirtyMarker = Exact.DirtyMarker;

  function Container(props, onChange) { // internal class
    this.onChange = onChange;

    if (props) {
      this.save(props);
    }
  }

  Exact.defineClass({

    constructor: Container,

    mixins: [Accessor.prototype, DirtyMarker.prototype],

    statics: {
      create: function create(props, onChange) {
        return new Container(props, onChange);
      }
    },

    set: function set(key, val) {
      var old = this[key];

      if (val !== old) {
        this[key] = val;

        DirtyMarker.check(this, key, val, old);

        if (this.onChange) {
          this.onChange();
        }
      }
    }
  });

  Exact.Container = Container;

})();
