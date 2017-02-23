//######################################################################################################################
// src/core/bindings/EventBinding.js
//######################################################################################################################
(function() {

  var Evaluator = Exact.Evaluator;

  function EventBinding() {
    this.evaluator = null;
    this.handler = '';
  }

  EventBinding.compile = function(template, type, target, context, locals) {
    var handler = template.handler, evaluator = template.evaluator;

    if (handler) {
      target.on(type, context[handler]/*.bind(context)*/);
    } else {
      locals = [null].concat(locals || []);
      target.on(type, function(event) {
        locals[0] = event; // TODO: if emit, event should be ignored
        Evaluator.activate(evaluator, 'exec', locals);
      });
    }
  };

  Exact.EventBinding = EventBinding;

})();
