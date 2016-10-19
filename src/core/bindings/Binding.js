//######################################################################################################################
// src/core/bindings/Binding.js
//######################################################################################################################
(function() {

  'use strict';

  var RES = Exact.RES;
  var EvaluatorUtil = Exact.EvaluatorUtil;
  var applyEvaluator = EvaluatorUtil.applyEvaluator;

  function Binding(scope, target, options) {
    this.scope = scope;
    this.target = target;

    this.mode = options.mode;
    //this.life = options.life;

    this.source = options.source;
    this.evaluator = options.evaluator;
    //this.assign = options.assign || assign;
    this.targetProp = options.targetProp;
    this.sourceProp = options.sourceProp;
    this.scopePaths = options.scopePaths;
    this.scopeEvent = options.scopeEvent;
    //this.targetEvent = options.targetEvent;
    this.converters = options.converters;

    this.exec = this.exec.bind(this);
  }

  Exact.defineClass({
    constructor: Binding,

    statics: {

      build: function(target, prop, scope, options) {
        var mode = options.mode,
          scopePaths = options.scopePaths, scopeEvent = options.scopeEvent,
          converters = options.converters, evaluator = options.evaluator;
        
        if (mode === 2) {
          var i, source, sourceProp, path = scopePaths[0];

          i = path.lastIndexOf('.');

          if (i < 0) {
            source = scope;
            sourceProp = path;
          } else {
            source = RES.search(path.slice(0, i), scope, true);
            sourceProp = path.slice(i+1);
          }
        }

        var binding = new Binding(scope, target, {
          mode: mode,
          //life: life,

          source: source,
          evaluator: evaluator,

          targetProp: prop,
          sourceProp: sourceProp,
          scopePaths: scopeEvent ? null : scopePaths,
          scopeEvent: scopeEvent,
          converters: converters
          //targetEvent: targetEvent
        });


        binding.exec({dispatcher: source});

        if (mode > 0/* && binding.life*/) {
          if (scopeEvent) {
            scope.on(scopeEvent, binding.exec);
          } else if (scopePaths) {
            eye('on', scopePaths, scope, target, binding);
          }

          if (mode === 2) {
            eye('on', [prop], target, source, binding);
          }
        }

        return binding;
      },

      clean: function(binding) {
        if (binding.scopeEvent) {
          binding.scope.off(binding.scopeEvent, binding.exec);
        } else if (binding.scopePaths) {
          eye('off', binding.scopePaths, binding.scope, binding.target, binding);
        }

        if (binding.mode === 2)  {
          eye('off', [binding.targetProp], binding.target, binding.source, binding);
        }
      }
    },

    exec: function(event) {
      var value,
        scope = this.scope,
        //assign = this.assign,
        evaluator = this.evaluator,
        converters = this.converters,
        source = this.source, target = this.target,
        sourceProp = this.sourceProp, targetProp = this.targetProp;

      if (this.mode !== 2) {
        value = applyEvaluator(evaluator, 'exec', scope, event);
        if (converters) {
          value = applyConverters(converters, 'exec', scope, event, value);
        }
        assign(target, targetProp, value);
      } else if (event.dispatcher !== target) {
        value = source[sourceProp];
        if (converters) {
          value = applyConverters(converters, 'exec', scope, event, value);
        }
        assign(target, targetProp, value);
      } else {
        value = target[targetProp];
        if (converters) {
          value = applyConverters(converters, 'back', scope, event, value);
        }
        assign(source, sourceProp, value);
      }

      //if (this.mode > 0 && !(--this.life)) {
      //  Binding.clean(this);
      //}
    }
  });

  function applyConverters(converters, name, scope, event, value) {
    var i, begin, end, step, evaluator;//, exec, rest, args;

    if (!converters.length) { return value; }

    if (name === 'exec') {
      //name = 'exec';
      begin = 0;
      step = +1;
      end = converters.length;
    } else {
      //name = 'back';
      begin = converters.length - 1;
      step = -1;
      end = -1;
    }

    for (i = begin; i !== end; i += step) {
      evaluator = converters[i];
      value = applyEvaluator(evaluator, name, scope, event, value);
    }

    return value;
  }

  function assign(target, key, val) {
    if (target.set) {
      target.set(key, val);
    } else {
      target[key] = val;
    }
  }

  function eye(fn, paths, scope, target, binding) {
    var i, j, n, path, attr, watcher, exec;

    for (i = 0, n = paths.length; i < n; ++i) {
      path = paths[i];//.name;
      j = path.lastIndexOf('.');
      if (j < 0) {
        attr = path;
        watcher = scope;
      } else {
        attr = path.slice(j + 1);
        watcher = RES.search(path.slice(0, j), scope, true);
      }

      if (watcher && watcher[fn]) {

        watcher[fn]('changed.' + attr, binding.exec);// TODO: binding.invalidate

        if (fn === 'on') {
          record(target, binding);
        } else {
          remove(target, binding);
        }
      }
    }
  }

  function record(target, binding) {
    var _bindings = target._bindings;

    if (_bindings) {
      _bindings.push(binding);
    } else {
      target._bindings = [binding];
    }
  }

  function remove(target, binding) {
    var _bindings = target._bindings;

    _bindings.splice(_bindings.indexOf(binding), 1);
  }

  Exact.Binding = Binding;

})();
