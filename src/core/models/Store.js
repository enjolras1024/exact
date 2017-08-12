//######################################################################################################################
// src/core/models/Store.js
//######################################################################################################################
(function() {

  var Watcher = Exact.Watcher;
  var Accessor = Exact.Accessor;

  function Store(props) {
    Store.initialize(this, props);
  }

  Exact.defineClass({
    constructor: Store,

    mixins: [Accessor.prototype, Watcher.prototype],

    statics: {
      create: function create(props) {
        return new Store(props);
      },

      initialize: function initialize(store, props) {
        if (!store._props) {
          Exact.defineProp(store, '_props', {value: {}/*, configurable: true*/});
        }

        store.save(props);
      }
    },

    get: function(key) {
      return this._props[key];
    },

    set: function set(key, val) {
      var props = this._props;

      if (!props.hasOwnProperty(key)) {
        Accessor.define(this, key);
        props[key] = null;
      }

      var old = props[key];

      if (val !== old) {
        props[key] = val;

        if (Exact.env === '<ES5') {
          this[key] = val;
        }

        //this.send('changed.' + key, val, old);
        this.send({type: 'changed', name: key}, val, old);
      }

      return this;
    }
  });

  Exact.Store = Store;

})();
