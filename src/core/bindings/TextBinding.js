//##############################################################################
// src/core/bindings/TextBinding.js
//##############################################################################
(function() {

  var Container = Exact.Container;
  var Binding = Exact.Binding;
  var Expression = Exact.Expression;
  var DataBinding = Exact.DataBinding;
  var DirtyMarker = Exact.DirtyMarker;

  var Array$join = Array.prototype.join;

  function TextBinding(property, target, context, container) {
    this.exec = this.exec.bind(this);

    this.property = property;
    this.target = target;
    this.context = context;
    this.container = container;
  }

  Exact.defineClass({
    constructor: TextBinding, //extend: Binding,

    statics: {
      /**
       *
       * @param {Array} template - pieces of strings and expressions
       * @param {string} property
       * @param {Object} target
       * @param {Object} context
       * @param {Object} locals
       */
      compile: function(template, property, target, context, locals) {
        var i, n, piece, container = Container.create(null, context.invalidate);

        for (i = 0, n = template.length; i < n; ++i) {
          piece = template[i];

          if (piece instanceof Expression) {
            Expression.activate(piece, i, container, context, locals);
          } else {
            container[i] = piece;
          }
        }

        container.length = n;

        var binding = new TextBinding(property, target, context, container);
        Binding.record(target, binding);
        binding.exec();

        context.on('updated', binding.exec);
      },

      clean: function clean(binding) {
        binding.context.off('updated', binding.exec);

        var bindings = binding.container._bindings;

        if (bindings) {
          for (var i = bindings.length - 1; i >= 0; --i) {
            DataBinding.clean(bindings[i]);
          }
        }

        Binding.remove(binding.target, binding);
      }
    },

    exec: function exec() {
      var container = this.container;

      if (!container.hasDirty()) { return; }

      Binding.assign(this.target, this.property, Array$join.call(container, ''));

      DirtyMarker.clean(container);
    }
  });

  Exact.TextBinding = TextBinding;

})();
