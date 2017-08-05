//######################################################################################################################
// src/core/shadows/Component.js
//######################################################################################################################
(function () {

  var assign = Exact.assign;
  var Shadow = Exact.Shadow;

  var Watcher = Exact.Watcher;
  var Accessor = Exact.Accessor;
  var Validator = Exact.Validator;
  var DirtyMarker = Exact.DirtyMarker;

  //var base = Shadow.prototype;
  
  var emptyDesc = {};

  function applyDescriptorsAndDefaults(prototype, descriptors, defaults) {
    if (Array.isArray(descriptors)) {
      var i, n, names = descriptors;
      descriptors = {};
      for (i = 0, n = names.length; i < n; ++i) {
        descriptors[names[i]] = emptyDesc;
      }
    }

    descriptors = assign({}, prototype.__descriptors__, descriptors);

    var key, desc;

    if (defaults) { // merge defaults into descriptors
      for (key in defaults) {
        if (defaults.hasOwnProperty(key) && !descriptors.hasOwnProperty(key)) {
          descriptors[key] = emptyDesc;
        }
      }
    }

    for (key in descriptors) { // define getter/setter for each key
      if (descriptors.hasOwnProperty(key) && !prototype.hasOwnProperty(key)) {
        Accessor.define(prototype, key);
        desc = descriptors[key] || emptyDesc;
        descriptors[key] = typeof desc !== 'object' ? {type: desc} : desc;
      }
    }

    Exact.defineProp(prototype, '__descriptors__', {value: descriptors});
  }

  function Component(props) {
    this.register();

    Component.initialize(this, props);

    this.ready();
  }

  Exact.defineClass({
    constructor: Component, extend: Shadow,

    mixins: [Watcher.prototype, Accessor.prototype],

    __descriptors__: { contents: emptyDesc }, // TODO: __exact_descriptors__

    statics: {
      //descriptors: { contents: null },

      /**
       * Factory method for creating a component
       *
       * @param {Function} ClassRef
       * @param {Object} props
       * @returns {Component}
       */
      create: function create(ClassRef, props) {
        return new ClassRef(props);
      },

      /**
       * Initialize this component, using template.
       *
       * @param {Component} component
       * @param {Object} props
       */
      initialize: function initialize(component, props) {
        var constructor = component.constructor, prototype = constructor.prototype, _template = constructor._template,
          resources = constructor.resources, descriptors = constructor.descriptors, defaults = constructor.defaults;

        if (!_template) {
          var template = constructor.template;

          if (template) {
            _template = Exact.HTMXEngine.parse(template, resources);
          }

          if (_template) {
            constructor._template = _template;
          } else {
            throw new TypeError('The template must be legal HTML string or DOM element');
          }
        }

        Shadow.initialize(component, _template.tag, _template.ns);
        
        defaults = typeof defaults === 'function' ? defaults() : null;

        if (!prototype.hasOwnProperty('__descriptors__')) {
          applyDescriptorsAndDefaults(prototype, descriptors, defaults); //
        }

        component.save(props ? assign({}, defaults, props) : defaults);

        Exact.HTMXEngine.start(_template, component);

        //component.send('initialized');
      }

    },

    //bindable: true,

    get: function(key) {
      var props = this._props, descriptors = this.__descriptors__;
      var desc = descriptors[key], get = desc.get;

      return get ? get.call(this, props) : props[key];
    },

    set: function set(key, val) {
      var props = this._props, descriptors = this.__descriptors__;

      var old, desc = descriptors[key];
      
      if (desc) {
        if (!Validator.validate(this, key, val, desc)) { return this; }

        var coerce = desc.coerce, get = desc.get, set = desc.set;

        old = get ? get.call(this) : props[key];

        if (coerce) {
          val = coerce.call(this, val);
        }

        if (val !== old) {
          if (set) {
            set.call(this, val);
          } else {
            props[key] = val;
          }

          if (Exact.env === '<ES5') {
            this[key] = val;
          }

          if (desc.native) { // rendered as attr
            DirtyMarker.check(this, key, val, old);
          }

          //this.send('changed.' + key, val, old);
          this.send({type: 'changed', name: key}, val, old);

          this.invalidate();//TODO:
        }
      } else {
        old = props[key];

        if (val !== old) {
          props[key] = val;

          if (Exact.env === '<ES5') {
            this[key] = val;
          }

          DirtyMarker.check(this, key, val, old);

          this.invalidate();
        }
      }

      return this;
    },

    /**
     * @abstract
     */
    register: function register() {},

    /**
     * @abstract
     */
    ready: function ready() {},

    /**
     * @abstract
     */
    refresh: function refresh() {},

    /**
     * @abstract
     */
    release: function release() {}

  });

  Exact.Component = Component;

})();
