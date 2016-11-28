//######################################################################################################################
// src/base/Watcher.js
//######################################################################################################################
(function() {

  'use strict';

  var Array$slice= [].slice;
  var ObjectUtil_defineProp = Exact.ObjectUtil.defineProp;

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
   * Add DOM event or custom event listener.
   *
   * @param {Watcher} watcher
   * @param {Object|string} type
   * @param {Function} exec
   * @param {boolean} useCapture
   * @returns {Object}
   */
  function register(watcher, type, exec, useCapture) {
    var actions = watcher._actions, constructor = watcher.constructor;

    // !(exec instanceof Function)
    if (typeof exec !== 'function') { return null; }

    if (!actions) {
      ObjectUtil_defineProp(watcher, '_actions', {value: {}});
      actions = watcher._actions;// = {};
    }

    var event = getFixedEvent(type);

    var action = actions[event.type];

    //  Create action
    if (!action) {// <=> action === undefined
      action = actions[event.type] = { handlers: []/*, keys: {}, listener: null*/ }; //TODO: {handlers: [], keys: {enter: []}}
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

    handlers.push(handler);

    //May add DOM event listener.
    if (!('listener' in action)){
      if (typeof constructor.addEventListenerFor === 'function') {
        constructor.addEventListenerFor(watcher, event.type, useCapture);
      } else {
        handler.listener = null;
      }
    }

    return action;
  }

  /**
   * Remove DOM event or custom event listener.
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
      for (i = 0; i < n; ++i) {
        handler = handlers[i];
        if ((all || exec === handler.exec) && (!keyName || keyName === handler.keyName)) {
          handlers.splice(i, 1);
          --action.count;
          break;
        }
      }
    }

    if (handlers.length === 0) {
      if (action.listener && typeof constructor.removeEventListenerFor === 'function') {/* <=> element && ('on' + type) in element*/
        constructor.removeEventListenerFor(watcher, event.type, useCapture);
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
   * @param {Boolean} keep
   * @param {Event|string} event
   * @param {Array} params
   */
  function dispatch(watcher, keep, event, params) {
    var actions = watcher._actions, action;

    if (actions) {
      event = getFixedEvent(event);
      //TODO: fix event
      action = actions[event.type];

      if (action) {
        event.dispatcher = watcher;

        if (keep) {
          params.unshift(event); //[event].concat(params);
        }

        var i, n, exec, handler, handlers = action.handlers;

        n = handlers.length;
        // trigger handlers
        for (i = 0; i < n; ++i) {
          handler = handlers[i];// handlers[ i ]( event.clone() );

          if (handler.keyName && handler.keyName !== event.keyName) { continue; }

          if (/*!event.eventPhase ||  */(event.eventPhase === 1) === !!handler.useCapture) {
            exec = handler.exec;
            exec.apply(null, params);
          }

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

          if (Array.isArray(value)){//  .on({click: [function(){...}}, true]);
            register(this, type, value[0], value[1]);
          } else {//  .on({click: function(){...}});
            register(this, type, value);
          }
        }
      } else if (type) {//  .on('click', context.onClick);
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

      if (n === 0) {// .off()

        clean(this);

      } else if (t === 'string') {

        if (n === 1) {//  .off('click');
          remove(this, type);
        } else {//  .off('click', context.onClick);
          remove(this, type, exec, useCapture);
        }

      } else if (t === 'object') {
        opts = type;
        for (type in opts) {
          if (!opts.hasOwnProperty(type)) { continue; }
          value = opts[type];
          if (Array.isArray(value)) {//  .off({click: [context.onClick, true]});
            remove(this, type, value[0], value[1]);
          } else {//  .off({click: context.onClick});
            remove(this, type, value);
          }
        }

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
      dispatch(this, false, type, params);
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
      dispatch(this, true, type, params);
      return this;
    }

  });

  //TODO: freeze

  Exact.Watcher = Watcher;

})();
