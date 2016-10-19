//######################################################################################################################
// src/core/shadows/Component.js
//######################################################################################################################
(function () {

  'use strict';

  var Watcher = Exact.Watcher;
  var Updater = Exact.Updater;
  //var Commander = Exact.Commander;
  var Validator = Exact.Validator;

  var Text = Exact.Text;
  var Shadow = Exact.Shadow;
  var Element = Exact.Element;

  //var HTMXTemplate = Exact.HTMXTemplate;
  //var ExpressionUtil = Exact.ExpressionUtil;

  var Shadow_set = Shadow.set;
  var Skin_isElement = Exact.Skin.isElement;
  var Validator_validate = Validator.validate;

  var base = Shadow.prototype;


  function Component(props) {
    //Register necessary properties for this component.
    this.register();

    //Initialize this component
    Component.initialize(this, props);

    //This component is ready
    this.ready();
  }

  //TODO: bindable = true

  Exact.defineClass({
    //TYPE: 'Exact.Component',
    constructor: Component,

    extend: Shadow,

    mixins: [Watcher.prototype/*, Context.prototype*/],

    statics: {
      fullName: 'Component',
      /**
       * Set the prop of the component by given key.
       *
       * @param {Component} component
       * @param {string} key
       * @param {*} val
       * @param {*} old
       * @param {Object} descriptors
       * @returns {boolean}
       */
      set: function set(key, val, old, component, descriptors) { // TODO: params
        if (!Validator_validate(component, key, val, descriptors)) { return false; }

        return Shadow_set.call(this, key, val, old, component, descriptors);
      },

      create: function create(ClassRef, props) { // TODO: build
        return new ClassRef(props);
      },

      destroy: function destroy(component) {
        var i, n, child, children = component.children;

        for (i = 0, n = children.length; i < n; ++i) {
          child = children[i];
          child.constructor.destroy(child);
        }

        component.off();
        Shadow.clean(component);
      },

      release: function release(component) {
        var i, children = component._children;
        if (children) {
          for (i = children.length - 1; i >= 0; --i) {
            Shadow.release(children[i]);
          }
        }

        var binding, _bindings = component._bindings;
        if (_bindings) {
          for (i = _bindings.length - 1; i >= 0; ++i) {
            binding = _bindings[i];
            binding.constructor.clean(binding);
          }
        }

        component.off();
        Shadow.clean(component);
      },

      /**
       * Initialize this element and its parts, and initParams.
       *
       * @param {Component} component
       * @param {Object} props
       */
      initialize: function initialize(component, props) {
        var HTMXTemplate = Exact.HTMXTemplate;

        var constructor = component.constructor, template = constructor.template, $template;

        if (!template) {
          $template = constructor.$template;

          if ($template && (typeof $template === 'string' || Skin_isElement($template))) {
            template = HTMXTemplate.parse(constructor.$template, constructor.imports);
          } else {
            template = HTMXTemplate.parse('<div></div>', constructor.imports);
            //throw new TypeError('$template must be legal HTML string or element');
          }

          constructor.template = template;
        } else if (!(template instanceof HTMXTemplate)) {
          throw new TypeError('The template must be instance of Exact.HTMXTemplate');
        }

        //TODO: check component.render()

        //props.tag = template.tag;

        Shadow.initialize(component, template.tag, props);
//        Accessor.initialize(component);

        HTMXTemplate.compile(template, component);

        component.send('initialized');
      }

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
    release: function release() {},

    invalidate: function(key, val, old) {
      base.invalidate.call(this, key, val, old);
      //var isInvalid = this.isInvalid;
      //
      //if (!isInvalid /*&& this.isDirty()*/) {
      //  this.isInvalid = true;
      //  console.log('invalidate', this.toString());
      //}

      if (key) {
        this.send('changed.' + key, val, old);
      }

      //if (!isInvalid) {
      //  Updater.add(this);
      //}
    }

  });

  Exact.Component = Component;

})();
