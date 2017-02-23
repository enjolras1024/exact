//######################################################################################################################
// src/base/Watcher.js
//######################################################################################################################
(function() {

  var Array$slice= Array.prototype.slice;

  function Watcher() {
    this._actions = null;
  }

  function getFixedEvent(info) {
    var event;

    if (info.type) {
      event = info;
    } else {
      event = {};

      var i = info.indexOf('.');

      if (i > 0) {
        event.type = info.slice(0, i);
        event.keyName = info.slice(i + 1);
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
   * @param {boolean} useCapture
   * @returns {Object}
   */
  function register(watcher, type, exec, useCapture) {
    var actions = watcher._actions, constructor = watcher.constructor;

    if (typeof exec !== 'function') { return null; }

    if (!actions) {
      Object.defineProperty(watcher, '_actions', {
        value: {}, writable: false, enumerable: false, configurable: true
      });
      actions = watcher._actions;
    }

    var event = getFixedEvent(type);

    var action = actions[event.type];

    //  Create action
    if (!action) {
      action = actions[event.type] = { handlers: []/*, listener: null*/ };
    }

    var handlers = action.handlers, keyName = event.keyName;

    var handler, i, n = handlers.length;
    // Check if exec exists in handlers.
    for (i = 0; i < n; ++i) {
      handler = handlers[i];
      if (exec === handler.exec && keyName === handler.keyName) {
        return action;
      }
    }

    handler = {exec: exec};

    if (keyName) {
      handler.keyName = keyName;
    }

    if (useCapture) {
      handler.useCapture = useCapture;
    }

    handlers.unshift(handler);

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
   * @param {boolean} useCapture
   * @returns {Object}
   */
  function remove(watcher, type, exec, useCapture) {
    var actions = watcher._actions, constructor = watcher.constructor, all = arguments.length === 2;

    if (!actions) { return; }

    var event = getFixedEvent(type);

    var action = actions[event.type];

    if (!action) { return; }

    var handlers = action.handlers, keyName = event.keyName;

    //if (!handlers) { return; }

    var handler, i, n = handlers.length;

    if (all && !keyName) {
      handlers.splice(0);
    } else {
      for (i = n-1; i >= 0; --i) {
      //for (i = 0; i < n; ++i) {
        handler = handlers[i];
        if ((all || exec === handler.exec) && (!keyName || keyName === handler.keyName)) {
          handlers.splice(i, 1);
          //--action.count;
          break;
        }
      }
    }

    if (handlers.length === 0) { //TODO: detach
      if (action.listener && typeof constructor.removeEventListener === 'function') {
        constructor.removeEventListener(watcher, action, event.type);
      }

      delete actions[event.type];
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

    action = actions[event.type];

    if (action) {
      event.dispatcher = watcher;

      if (keep) {
        params.unshift(event); //[event].concat(params);
      }

      var i, n, exec, handler, handlers = action.handlers;

      n = handlers.length;
      // trigger handlers
      //for (i = 0; i < n; ++i) {
      for (i = n-1; i >= 0; --i) {
        handler = handlers[i];

        if (!handler || (handler.keyName && handler.keyName !== event.keyName)) { continue; }

        if ((event.eventPhase === 1) === !!handler.useCapture) {
          exec = handler.exec;
          exec.apply(null, params);
        }
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
     * @param {boolean} useCapture
     * @returns {self}
     */
    on: function on(type, exec, useCapture) {
      var opts, value;

      if (typeof type === 'object') {
        opts = type;

        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }

          value = opts[type];

          if (Array.isArray(value)){  // e.g. on({click: [function(){...}}, true]); useCapture as 2nd argument
            register(this, type, value[0], value[1]);
          } else {                    // e.g. on({click: function(){...}});
            register(this, type, value);
          }
        }
      } else if (type) {              // e.g. on('click', context.onClick);
        register(this, type, exec, useCapture);
      }

      return this;
    },


    /**
     * Use Watcher to remove DOM event or custom event handler.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @param {boolean} useCapture
     * @returns {self}
     */
    off: function off(type, exec, useCapture) {
      var n = arguments.length, t = typeof type, opts, value;

      if (n === 0) {      // e.g. off()
        clean(this);
      } else if (t === 'string') {
        if (n === 1) {    // e.g. off('click');
          remove(this, type);
        } else {          // e.g. off('click', context.onClick);
          remove(this, type, exec, useCapture);
        }
      } else if (t === 'object') {
        opts = type;
        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }
          value = opts[type];
          if (Array.isArray(value)) {   // e.g. off({click: [context.onClick, true]});
            remove(this, type, value[0], value[1]);
          } else {                      // e.g. off({click: context.onClick});
            remove(this, type, value);
          }
        }
      }

      return this;
    },

    /**
     * It works like `on`. But the handler will be removed once it executes for the first time.
     *
     * @param {Object|string} type
     * @param {Function} exec
     * @param {boolean} useCapture
     * @returns {self}
     */
    once: function(type, exec, useCapture) {
      var self = this;

      function func() {
        self.off(type, func, useCapture);
        exec.apply(null, arguments);
      }

      this.on(type, func, useCapture);

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

  Exact.Watcher = Watcher;

})();
