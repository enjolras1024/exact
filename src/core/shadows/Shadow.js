//######################################################################################################################
// src/core/shadows/Shadow.js
//######################################################################################################################
(function() {
  'use strict';

  var Skin = Exact.Skin;

  var Cache = Exact.Cache;
  var Collection = Exact.Collection;

  var Updater = Exact.Updater;
  var Accessor = Exact.Accessor;
  var DirtyChecker = Exact.DirtyChecker;

  var setImmediate = Exact.setImmediate;

  var ObjectUtil = Exact.ObjectUtil;

  var Accessor_set = Accessor.set;
  var DirtyChecker_check = DirtyChecker.check;
  var DirtyChecker_clean = DirtyChecker.clean;

  var ObjectUtil_assign = ObjectUtil.assign;
  var ObjectUtil_defineProp = ObjectUtil.defineProp;

  var uid = 0;//Number.MIN_VALUE;

  function createCache(shadow) {
    var cache = new Cache();

    cache.onChange = shadow.invalidate;

    return cache;
  }

  function createCollection(shadow) {
    var collection = new Collection();

    collection.onChange = shadow.invalidate;
    //TODO: collection.on('change', shadow.invalidate);

    return collection;
  }

  ///**
  // * props getter
  // *
  // * @returns {Cache}
  // */
  //function getProps() {
  //  if (!this._props) {
  //    ObjectUtil_defineProp(this, '_props', {value: createCache(this)});
  //  }
  //  return this._props;
  //}

  /**
   * props getter
   *
   * @returns {Cache}
   */
  function getAttrs() {
    if (!this._attrs) {
      ObjectUtil_defineProp(this, '_attrs', {value: createCache(this), configurable: true});
    }
    return this._attrs;
  }

  /**
   * style getter
   *
   * @returns {Cache}
   */
  function getStyle() {
    if (!this._style && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_style', {value: createCache(this), configurable: true});
    }
    return this._style;
  }

  /**
   * classes getter
   *
   * @returns {Cache}
   */
  function getClasses() {
    if (!this._classes && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_classes', {value: createCache(this), configurable: true});
    }
    return this._classes;
  }

  /**
   * children getter
   *
   * @returns {Collection}
   */
  function getChildren() {
    if (!this._children && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_children', {value: createCollection(this), configurable: true});
    }
    return this._children;
  }

  /**
   * children getter
   *
   * @returns {Collection}
   */
  function getContents() {
    if (!this._contents && Skin.isElement(this.$skin)) {
      ObjectUtil_defineProp(this, '_contents', {value: createCollection(this), configurable: true});
    }
    return this._contents;
  }

  var defineMembersOf;

  if (ObjectUtil.support('accessor')) {
    // lazy mode when getter is supported
    defineMembersOf = function(shadow) {
      ObjectUtil_defineProp(shadow, 'attrs', {get: getAttrs});
      ObjectUtil_defineProp(shadow, 'style', {get: getStyle});
      ObjectUtil_defineProp(shadow, 'classes', {get: getClasses});
      ObjectUtil_defineProp(shadow, 'children', {get: getChildren});
      //ObjectUtil_defineProp(shadow, 'contents', {get: getContents});//TODO: set('contents', []) if fine
    }

  } else {
    // immediate mode when getter is not supported
    defineMembersOf = function(shadow) {
      ObjectUtil_defineProp(shadow, 'attrs', {value: createCache(shadow)});
      ObjectUtil_defineProp(shadow, 'style', {value: createCache(shadow)});
      ObjectUtil_defineProp(shadow, 'classes', {value: createCache(shadow)});
      ObjectUtil_defineProp(shadow, 'children', {value: createCollection(shadow)});
      //ObjectUtil_defineProp(shadow, 'contents', {value: createCollection(shadow)});

      shadow._attrs = shadow.attrs;
      shadow._style = shadow.style;
      shadow._classes = shadow.classes;
      shadow._children = shadow.children;
      shadow._contents = shadow.contents;
    }
  }

  function extract(children) {
    var i, n, m, $skin, child, $children;

    m = 0;
    n = children.length;

    $children = [];

    for (i = 0; i < n; ++i) {
      child = children[i];
      $skin = child.$skin;
      //TODO: child.ignored
      if ((child instanceof Shadow) && $skin) {
        $children.push($skin);
        //if (Skin.canExtend($skin)) {
        //  $skin.toIndex = m++; //
        //}
      }
    }

    return $children;
  }


  /**
   *
   * @constructor
   */
  function Shadow() {
    throw new Error('');
  }

  Exact.defineClass({
    constructor: Shadow,

//    extend: Context,
    mixins: [Accessor.prototype, DirtyChecker.prototype],

    update: function update() { //TODO: enumerable = false
      if (!this.isInvalid) { return; } // TODO: _secrets, is.invalid, is.refreshed,

      console.log('update', this.toString());

      if (this.refresh) {
        this.refresh();
      } //TODO: shouldRefresh()£¬ last chance to update shadow and its children

      if (this.send) {
        //shadow.send('refresh');//TODO: beforeRefresh, refreshing
        this.send('refreshed');//TODO: beforeRefresh, refreshing
      }

      //if (shadow.render) {
      //  shadow.render();
      //}

      Shadow.render(this);

      Shadow.clean(this);
    },

    /**
     * Make this shadow invalid and register it to the batchUpdater.
     *
     * @returns {self}
     */
    invalidate: function invalidate(key, val, old) { //TODO: as static method, maybe

      if (!this.isInvalid /*&& this.isDirty()*/) {
        console.log('invalidate', this.toString());
        this.isInvalid = true;
        Updater.add(this);
      }

      return this;
    },

    //TODO: debug
    toString: function toString() {
      var constructor = this.constructor;

      var tag = Skin.getProp(this.$skin, 'tagName');

      return (constructor.fullName || constructor.name) + '<' + (tag ? tag.toLowerCase() : '') + '>('+this.guid+')';
    },

    blur: function blur() {
      var $skin = this.$skin;
      setImmediate(function() {
        Skin.blur($skin);
      });
    },

    focus: function focus() {
      var $skin = this.$skin;
      setImmediate(function() {
        Skin.focus($skin);
      });
    },

    //reset: function reset(props) {
    //  var key, all = {}, _propSet = this.constructor._propSet, descriptors = this._descriptors_;
    //
    //  if (descriptors) {
    //    for (key in descriptors) {
    //      if (descriptors.hasOwnProperty(key)) {
    //        all[key] = undefined;
    //      }
    //    }
    //  }
    //
    //  if (typeof this.defaults === 'function') {
    //    var defaults = this.defaults();
    //  }
    //
    //  ObjectUtil_assign(all, defaults, props);
    //
    //  for (key in _propSet) {
    //    if (_propSet.hasOwnProperty(key) && !all.hasOwnProperty(key)) {
    //      delete this[key];
    //    }
    //  }
    //
    //  this.set(all);
    //},

    statics: {
      //mixins: [Accessor],

      set: function set(key, val, old, shadow, descriptors) { // TODO: params
        var changed = Accessor_set.call(this, key, val, old, shadow, descriptors);

        if (changed) {
          DirtyChecker_check(shadow, key, this[key], old);

          shadow.invalidate(key, this[key], old);//TODO:
        }

        //shadow.constructor._propSet[key] = true; // mark
 
        return changed;
      },


      /**
       * @abstract
       * @param {Shadow} shadow
       * @param {string} tag
       * @param {Object} props
       */
      initialize: function initialize(shadow, tag, props) {
//        throw new Error('initialize() must be implemented by subclass!');
        shadow.guid = ++uid;

        Shadow.initSkin(shadow, tag);

        if (Skin.isElement(shadow.$skin)) {
          defineMembersOf(shadow);
        }

        shadow.update = shadow.update.bind(shadow);
        shadow.invalidate = shadow.invalidate.bind(shadow);
        //shadow._update = Shadow.update.bind(null, shadow);

        //var constructor = shadow.constructor;
        //if (!constructor._propSet) {
        //  ObjectUtil_defineProp(constructor, '_propSet', {value: {}});
        //}

        Accessor.initialize(shadow, props);
      },

      /**
       * Create $skin for the shadow.
       *
       * @param {Shadow} shadow
       * @param {string} tag
       */
      initSkin: function initSkin(shadow, tag) {
        ObjectUtil_defineProp(shadow, '$skin', {value: tag/* !== 'TEXT'*/ ? Skin.createElement(tag) : Skin.createText('')}); //TODO: $shin._secrets = {$skin: ...}
//        shadow.$skin._shadow = shadow; //TODO: strict
        if (Skin.canExtend(shadow.$skin)) {
          ObjectUtil_defineProp(shadow.$skin, '_shadow', {value: shadow});
        }
      },

      clean: function clean(shadow) {
        shadow.isInvalid = false;
      },

      /**
       * Auto render the props, style, classes and children to the $skin.
       *
       * @param {Shadow} shadow
       */
      render: function render(shadow) {
//        if (!shadow.isInvalid) { return; }

        var $skin = shadow.$skin,
          props = shadow,
          attrs = shadow._attrs,
          style = shadow._style,
          classes = shadow._classes,
          children = shadow._children,
          dirty = null;

        if (props && shadow._dirty) { //TODO: textContent => children
          dirty = shadow._dirty;
          //Shadow.clean(props);
          Skin.renderProps($skin, props, dirty);
        }

        if (Skin.isElement($skin)) {
          if (attrs && attrs._dirty) { //TODO: textContent => children
            dirty = attrs._dirty;
            Cache.clean(attrs);

            Skin.renderAttrs($skin, attrs, dirty);
          }

          //TODO: requestAnimationFrame
          if (style && style._dirty) {
            dirty = style._dirty;
            Cache.clean(style);

            Skin.renderStyle($skin, style, dirty);
          }

          if (classes && classes._dirty) {
            dirty = classes._dirty;
            Cache.clean(classes);

            Skin.renderClasses($skin, classes, dirty);
          }

          if (children && children.isInvalid) {
            Collection.clean(children);

            var $removed = Skin.renderChildren($skin, extract(children));

            if ($removed && $removed.length > 0) {
              for (var i = 0, n = $removed.length; i < n; ++i) {
                var $parent = Skin.getParent($removed[i]);
                if (!$parent) {
                  shadow = Shadow.getShadow($removed[i]);
                  Shadow.release(shadow);
                }
              }
            }
            // It is a little hard for IE 8
          }
        }
      },

      /**
       * @abstract
       * @param {Shadow} shadow
       */
      release: function release(shadow) {
        var releaseImpl = shadow.constructor.release;
        if (releaseImpl) {
          releaseImpl(shadow);
        }

        if (shadow.release) {
          shadow.release();
        }
      }, //TODO: when and how to destroy?

      /**
       * Get the shadow of the $skin
       *
       * @param {Node} $skin
       * @returns {Shadow}
       */
      getShadow: function getShadow($skin) {
        return $skin && $skin._shadow;
      },

      /**
       * Find the part matching the CSS selector
       *
       * @param {Shadow} shadow
       * @param {string} selector
       * @returns {Shadow}
       */
      findShadow: function findShadow(shadow, selector) { //TODO: helper, findShadow
        if (Skin.isElement(shadow.$skin)) {
          return Shadow.getShadow(Skin.query(shadow.$skin, selector));
        }
      },

      /**
       * Find all the parts matching the CSS selector
       *
       * @param {Shadow} shadow
       * @param {string} selector
       * @returns {Array}
       */
      findShadows: function findShadows(shadow, selector) { //TODO: helper, findShadows
        if (Skin.isElement(shadow.$skin)) {
          var i, n, parts = [], $nodes = Skin.queryAll(shadow.$skin, selector);

          for (i = 0, n = $nodes.length; i < n; ++i) {
            parts.push(Shadow.getShadow($nodes[i]));
          }

          return parts;
        }
      },

      /**
       * Get the parent shadow of the shadow
       *
       * @param {Shadow} shadow
       * @returns {Shadow}
       */
      getParentShadow: function getParentShadow(shadow) { //TODO: helper
        return Shadow.getShadow(Skin.getParent(shadow.$skin));
      },


      addEventListenerFor: function (shadow, type, useCapture) {
        var action = shadow._actions[type], $skin;

//        if (Skin.useTopEventDelegate) {
//          return;
//        }

        $skin = shadow.$skin;

        if (Skin.mayDispatchEvent($skin, type)) {//TODO: No problem?
          action.listener = function (event) {
            shadow.send(Skin.getFixedEvent(event)); // TODO: Shadow.getShadow(domEvent.currentTarget).send()
          };

          Skin.addEventListener($skin, type, action.listener, useCapture);
        } else {
          action.listener = null;
        }
      },

      removeEventListenerFor: function (shadow, type, useCapture) {
        var actions = shadow._actions, action = actions[type], $skin;

//      if (Exact.useTopEventDelegate) {
//        return;
//      }

        $skin = shadow.$skin;

        if (Skin.mayDispatchEvent($skin, type)) {
          Skin.removeEventListener($skin, type, action.listener, useCapture);

          delete action.listener;
        }
      }

    }
  });

  var finalStaticMethods = [
    'update', 'refresh', 'initSkin', 'getShadow', 'findShadow', 'findShadows', 'getParentShadow'
  ];

  for (var i = 0; i < finalStaticMethods.length; ++i) {
    ObjectUtil_defineProp(Shadow, finalStaticMethods[i], {writable: false, enumerable: false, configurable: true});
  }



//  function listener(event) {
//
//    var i, n, path, target;
//
//    event = Skin.getFixedDOMEvent(event);
//
//    target = event.target;
//
//    path = [target];
//
//    while (target.parentNode) {
//      target = target.parentNode;
//      path.push(target);
//    }
//
//    if (event.bubbles) {
//      for (i = 0; i < n; ++i) {
//        if (event.shouldStop) { break; }
//        Shadow.getShadow(path[i]).send(event);
//      }
//    } else { //TODO: useCapture
//      for (i = n - 1; i >= 0; --i) {
//        if (event.shouldStop) { break; }
//        Shadow.getShadow(path[i]).send(event);
//      }
//    }
//  }
//
//  if (document) {
//    var i, n, events = ['click'], addEventListener;
//
//    for (i = 0, n = events.length; i < n; ++i) {
//      addEventListener = document.addEventListener || document.attachEvent;
//      addEventListener.call(document, events[i], listener);
//    }
//  }

  Exact.Shadow = Shadow;
  
})();
