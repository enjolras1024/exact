//######################################################################################################################
// src/core/bindings/DataBinding.js
//######################################################################################################################
(function() {

  var RES = Exact.RES;
  var Binding = Exact.Binding;
  var PathUtil = Exact.PathUtil;
  var Evaluator = Exact.Evaluator;

  var MODES = { ONE_TIME: 0, ONE_WAY: 1, TWO_WAY: 2 };

  function DataBinding(
    mode,

    context,
    locals,
    target,
    source,

    evaluator,
    converters,

    targetProp,
    sourceProp,

    event,
    paths
  ) {
    this.mode = mode;
    this.active = true;

    this.context = context;
    this.locals = locals;
    this.target = target;
    this.source = source;

    this.evaluator = evaluator;
    this.converters = converters;

    this.targetProp = targetProp;
    this.sourceProp = sourceProp;

    this.event = event;
    this.paths = paths;

    this.exec = this.exec.bind(this); // TODO: use different exec in different mode

    if (mode === MODES.TWO_WAY) {
      this.back = this.back.bind(this);
    }
  }

  Exact.defineClass({
    constructor: DataBinding, //extend: Binding,

    statics: {

      MODES: MODES,

      compile: function(template, targetProp, target, context, locals) {
        var mode = template.mode,
          paths = template.paths,
          event = template.event,
          evaluator = template.evaluator,
          converters = template.converters;

        locals = locals || [];

        if (mode === MODES.TWO_WAY) {
          var i, source, sourceProp, path;

          path = paths[0];
          i = path.length - 1;
          sourceProp = path[i];
          source = RES.search(path.slice(0, i), locals[path.origin], true);
        }

        var binding = new DataBinding(
          mode,

          context,
          locals,
          target,
          source,

          evaluator,
          converters,

          targetProp,
          sourceProp,

          event,
          event ? null : paths
        );
        // TODO: use different exec in different mode

        var flag = 0;

        var method = mode === MODES.ONE_TIME ? 'once' : 'on';

        if (!event) {
          flag = eye(method, paths, locals, binding);
        } else {
          context.on(event, binding.exec);
        }

        if (flag) {
          Binding.record(target, binding);
        }

        if (flag >= 0) {
          //var collection = Exact.Dep.begin(binding);
          binding.exec();
          //Exact.Dep.end();
        } else {
          //DataBinding.clean(binding);
          binding.active = false;
        }

        if (mode === MODES.TWO_WAY && target.on && source) {
          target.on('changed.' + targetProp, binding.back);
          //record(source, binding);
        }

        return binding;
      },

      clean: function(binding) {
        var flag = 0,
          mode = binding.mode,
          target = binding.target,
          locals = binding.locals,
          context = binding.context;

        if (mode === MODES.ONE_TIME) { return; }

        if (!binding.event) {
          flag = eye('off', binding.paths, locals, binding);
        } else if (context.off) {
          context.off(binding.event, binding.exec);
          flag = -1;
        }

        if (flag > 0) {
          Binding.remove(target, binding);
        }

        if (binding.mode === MODES.TWO_WAY && target.off)  {
          target.off('changed.' + binding.targetProp, binding.back);
          //remove(binding.source, binding);
        }

        binding.active = false;
      }
    },

    exec: function() {
      if (!this.active) { return; }
      
      var value,

        locals = this.locals,
        evaluator = this.evaluator,
        converters = this.converters,

        //source = this.source, sourceProp = this.sourceProp,
        target = this.target, targetProp = this.targetProp;

      value = Evaluator.activate(evaluator, 'exec', locals);
      if (converters) {
        value = applyConverters(converters, 'exec', locals, value);
      }
      Binding.assign(target, targetProp, value);

      if (this.mode === MODES.ONE_TIME) {
        DataBinding.clean(this);
      }
    },

    back: function back() {
      var value,

        locals = this.locals,
        //evaluator = this.evaluator,
        converters = this.converters,

        source = this.source, sourceProp = this.sourceProp,
        target = this.target, targetProp = this.targetProp;

      value = target[targetProp];
      if (converters) {
        value = applyConverters(converters, 'back', locals, value);
      }
      Binding.assign(source, sourceProp, value);
    }
  });

  function applyConverters(converters, name, locals, value) {
    var i, begin, end, step, evaluator;//, exec, rest, args;

    if (!converters.length) { return value; }

    if (name === 'exec') {
      begin = 0;
      step = +1;
      end = converters.length;
    } else { // name === 'back';
      begin = converters.length - 1;
      step = -1;
      end = -1;
    }

    for (i = begin; i !== end; i += step) {
      evaluator = converters[i];
      value = Evaluator.activate(evaluator, name, locals, value);
    }

    return value;
  }

  function dep(i, prop, paths, source, origin) {
    var descriptors = source.__descriptors__;

    var desc = descriptors && descriptors[prop];

    if (desc && desc.depends) {
      var j, n, path, depends = desc.depends;

      for (j = 0, n = depends.length; j < n; ++j) {
        path = PathUtil.parse(depends[j]); //TODO:
        path.origin = origin;
        paths.push(path);
      }

      paths[i] = null;

      return true;
    }
  }

  function eye(method, paths, locals, binding) {
    if (!locals || !paths || !paths.length) { return 0; }

    var i, j, path, prop, flag = 0, local, source;

    for (i = 0; i < paths.length; ++i) {
      path = paths[i];

      if (!path) { continue; }

      j = path.length - 1;
      local = locals[path.origin];
      prop = path[j];
      source = j < 1 ? local : RES.search(path.slice(0, j), local, true);

      if (!source) {
        if (j > 0 && method !== 'off' && listen(method, path, locals, binding)) {
          flag = -1;
        }
        continue;
      }

      if (method !== 'off' && dep(i, prop, paths, source, path.origin)) {
        continue;
      }

      if (flag >= 0 && source[method] /*&& source.bindable*/) {
        source[method]('changed.' + prop, binding.exec);
        flag = 1;
      } else {
        //paths[i] = null;
      }
    }

    return flag;
  }

  function listen(method, path, locals, binding) {
    var target, source, i = 0;
    source = locals[path.origin];
    target = source[path[i]];

    while (target) {
      source = target;
      target = source[path[++i]];
    }

    var descriptors = source.__descriptors__;
    var desc = descriptors && descriptors[path[i]];

    if (desc && desc.uncertain && source[method]) {
      source[method]('changed.' + path[i], function() { // util some unknown dependency has changed
        var flag = eye('off', [path], locals, binding);
        flag = eye(method, [path], locals, binding);
        if (flag >= 0) {
          binding.active = true;
          binding.exec();
        }
      });

      return true;
    }

    return false;
  }

  Exact.DataBinding = DataBinding;

})();
