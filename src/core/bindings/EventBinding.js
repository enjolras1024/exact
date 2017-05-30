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
      var func = context[handler];
      if (!func) {
        throw new ReferenceError('no such handler named ' + handler + ' in ' + context);
      }
      //if (!func.__bound__to__) { // TODO: __exact__bound__
      //  func = func.bind(context);
      //  Exact.defineProp(func, '__bound__to__', {
      //    value: context, writable: false, enumerable: false, configurable: true
      //  });
      //  context[handler] = func;
      //}
      target.on(type, func);
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
