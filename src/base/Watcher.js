//######################################################################################################################
// src/base/Watcher.js
//######################################################################################################################
(function() {

  var Array$slice= Array.prototype.slice;

  function Watcher() {
    this._actions = null;
  }

  function getFixedEvent(info) { // TODO: keyup.enter!capture|once+=""
    var event;

    if (info.type) {
      event = info;
    } else {
      event = {};

      var i = info.indexOf('.');//, l = info.length;

      if (info[0] === '!') {
        event.capture = true;
        info = info.slice(1);
      }

      if (i > 0) {
        event.type = info.slice(0, i);
        event.name = info.slice(i + 1);
      } else {
        event.type = info;
      }
    }

    return event;
  }

  /**
   * Add custom event handler or DOM event listener.
   *
   * @param {Watcher} watcher
   * @param {Object|string} type
   * @param {Function} exec
   * @returns {Object}
   */
  function register(watcher, type, exec) {
    var actions = watcher._actions, constructor = watcher.constructor;

    if (typeof exec !== 'function') { return null; }

    if (!actions) {
      Exact.defineProp(watcher, '_actions', {
        value: {}, writable: false, enumerable: false, configurable: true
      });
      actions = watcher._actions;
    }

    var event = getFixedEvent(type);

    type = (event.capture ? '!' : '') + event.type;

    var action = actions[type];

    //  Create action
    if (!action) {
      action = actions[type] = { handlers: []/*, listener: null, listenerCapture: null*/, capture: event.capture };
    }

    var handlers = action.handlers, name = event.name;

    var handler, i, n = handlers.length;
    // Check if exec exists in handlers.
    for (i = 0; i < n; ++i) {
      handler = handlers[i];
      if (exec === handler.exec && name === handler.name) {
        return action;
      }
    }

    handler = {exec: exec};

    if (name) {
      handler.name = name;
    }

    //if (useCapture) {
    //  handler.useCapture = useCapture;
    //}

    //handlers.unshift(handler);
    handlers.push(handler);

    //May add DOM event listener.
    if (!('listener' in action)){
      if (typeof constructor.addEventListener === 'function') {
        constructor.addEventListener(watcher, action, event.type);
      } else {
        handler.listener = null;
      }
    }

    return action;
  }

  /**
   * Remove custom event handler or DOM event listener.
   *
   * @param {Watcher} watcher
   * @param {Object|string} type
   * @param {Function|string} exec
   * @returns {Object}
   */
  function remove(watcher, type, exec) {
    var actions = watcher._actions, constructor = watcher.constructor, all = arguments.length === 2;

    if (!actions) { return; }

    var event = getFixedEvent(type);

    type = (event.capture ? '!' : '') + event.type;

    var action = actions[type];

    if (!action) { return; }

    var handlers = action.handlers, name = event.name;

    //if (!handlers) { return; }

    var handler, i, n = handlers.length;

    if (all && !name) {
      handlers.length = 0; // handlers.splice(0);
    } else {
      //for (i = n-1; i >= 0; --i) {
      for (i = 0; i < n; ++i) {
        handler = handlers[i];
        if ((all || exec === handler.exec) && (!name || name === handler.name)) {
          handlers.splice(i--, 1);
          break;
        }
      }
    }

    if (handlers.length === 0) {
      if (action.listener && typeof constructor.removeEventListener === 'function') {
        constructor.removeEventListener(watcher, action, event.type);
      }

      delete actions[type];
    }

    return action;
  }

  function clean(watcher) {
    var actions = watcher._actions, type;

    if (!actions) { return; }

    for (type in actions) {
      if (actions.hasOwnProperty(type)) {
        remove(watcher, type);
      }
    }
  }

  /**
   *
   * @param {Watcher} watcher
   * @param {Array} params
   * @param {Event|string} event
   * @param {boolean} keep
   */
  function dispatch(watcher, params, event, keep) {
    var actions = watcher._actions, action;

    if (!actions) { return; }

    event = getFixedEvent(event);

    action = actions[(event.capture ? '!' : '') + event.type];

    if (action) {
      event.dispatcher = watcher;

      if (keep) {
        params.unshift(event); //[event].concat(params);
      }

      var i, n, exec, handler, handlers = action.handlers;

      n = handlers.length;
      // trigger handlers
      for (i = 0; i < n; ++i) {
      //for (i = n-1; i >= 0; --i) {
        handler = handlers[i];

        if (!handler || (handler.name && handler.name !== event.name)) { continue; }
        //if ((event.eventPhase === 1) === !!handler.useCapture) {
          exec = handler.exec;
          exec.apply(null, params);
        //}
      }
    }
  }

  Exact.defineClass({
    /**
     * A watcher can add and remove event handlers, emit or send event with or without extra parameters.
     *
     * @constructor
     */
    constructor: Watcher,

    /**
     * Use Watcher to add DOM event or custom event handler.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @returns {self}
     */
    on: function on(type, exec) {
      var opts, value;

      if (typeof type === 'object') {
        opts = type;

        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }

          value = opts[type];

          //if (Array.isArray(value)){  // e.g. on({click: [function(){...}}, true]); useCapture as 2nd argument
          //  register(this, type, value[0], value[1]);
          //} else {                    // e.g. on({click: function(){...}});
            register(this, type, value);
          //}
        }
      } else if (type) {              // e.g. on('click', context.onClick);
        register(this, type, exec);
      }

      return this;
    },


    /**
     * Use Watcher to remove DOM event or custom event handler.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @returns {self}
     */
    off: function off(type, exec) {
      var n = arguments.length, t = typeof type, opts, value;

      if (n === 0) {      // e.g. off()
        clean(this);
      } else if (t === 'string') {
        if (n === 1) {    // e.g. off('click');
          remove(this, type);
        } else {          // e.g. off('click', context.onClick);
          remove(this, type, exec);
        }
      } else if (t === 'object') {
        opts = type;
        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }
          value = opts[type];
          //if (Array.isArray(value)) {   // e.g. off({click: [context.onClick, true]});
          //  remove(this, type, value[0], value[1]);
          //} else {                      // e.g. off({click: context.onClick});
            remove(this, type, value);
          //}
        }
      }

      return this;
    },

    /**
     * It works like `on`. But the handler will be removed once it executes for the first time.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @returns {self}
     */
    once: function(type, exec) {
      var t = typeof type;

      if (t === 'object') {
        var opts = type, value;

        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }

          value = opts[type];

          //if (Array.isArray(value)){  // e.g. once({click: [function(){...}}, true]); useCapture as 2nd argument
          //  this.once(type, value[0], value[1]);
          //} else {                    // e.g. once({click: function(){...}});
            this.once(type, value);
          //}
        }
      } else {
        var self = this;

        var func = function() {
          self.off(type, func);
          exec.apply(null, arguments);
        };

        this.on(type, func);
      }

      return this;
    },

    /**
     * Dispatch custom event, handlers accept rest arguments.
     *
     * @example #emit('ok', a, b) may trigger function(a, b){}
     * @param {Event|Object|string} type
     * @returns {self}
     */
    emit: function emit(type/*, ...rest*/) {
      var params = Array$slice.call(arguments, 1);
      dispatch(this, params, type, false);
      return this;
    },

    /**
     * Dispatch custom event with extras.
     *
     * @example #send('ok', a, b) may trigger function(event, a, b){}
     * @param {Event|Object|string} type
     * @returns {self}
     */
    send: function send(type/*, ...rest*/) {
      var params = Array$slice.call(arguments, 1);
      dispatch(this, params, type, true);
      return this;
    }

  });

  Watcher.getFixedEvent = getFixedEvent;

  Exact.Watcher = Watcher;

})();
