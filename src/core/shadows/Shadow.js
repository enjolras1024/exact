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
    var i, n, $skin, child, $children;

    n = children.length;

    $children = [];

    for (i = 0; i < n; ++i) {
      child = children[i];
      $skin = child.$skin;

      if (/*(child instanceof Shadow) && */!child.excluded && $skin) {
        $children.push($skin);
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

    /**
     * Make this shadow invalid and register it to the batchUpdater.
     *
     * @returns {self}
     */
    invalidate: function invalidate(key, val, old) { //TODO: as static method, maybe

      if (!this.isInvalid /*&& this.isDirty()*/) {
        console.log('invalidate', this.toString());
        this.isInvalid = true;
        Updater.insert(this);
      }

      return this;
    },

    update: function update() { //TODO: enumerable = false
      if (!this.isInvalid) { return; } // TODO: _secrets, is.invalid, is.refreshed,

      console.log('update', this.toString());

      if (this.refresh) {
        this.refresh();
      } //TODO: shouldRefresh()£¬ last chance to update shadow and its children

      Updater.append(this);
      //Shadow.render(this);
      //Shadow.clean(this);

      //if (this.send) {
      //  //shadow.send('refresh');//TODO: beforeRefresh, refreshing
      //  this.send('refreshed');//TODO: beforeRefresh, refreshing
      //}
    },

    render: function render() {
      if (!this.isInvalid) { return; }

      var $skin = this.$skin,
        props = this, // <--
        attrs = this._attrs,
        style = this._style,
        classes = this._classes,
        children = this._children,
        dirty = null;

      if (props && props._dirty) { //TODO: textContent => children
        dirty = props._dirty;
        //Shadow.clean(props);

        Skin.renderProps($skin, props, dirty, this._secrets.final);
      }

      Shadow.clean(this);

      if (Skin.isElement($skin)) {
        if (attrs && attrs._dirty) {
          dirty = attrs._dirty;
          Cache.clean(attrs);

          Skin.renderAttrs($skin, attrs, dirty);
        }

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
              var shadow = Shadow.getShadow($removed[i]);
              if (!$parent && !shadow.hasOwnProperty('excluded')) {
                Shadow.release(shadow);
              }
            }
          }
          // It is a little hard for IE 8
        }
      }
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

    statics: {

      set: function set(key, val, old, shadow, descriptors) { // TODO: params
        var changed = Accessor_set.call(this, key, val, old, shadow, descriptors);

        if (changed) {
          DirtyChecker_check(shadow, key, this[key], old);

          shadow.invalidate(key, this[key], old);//TODO:
        }
 
        return changed;
      },


      /**
       * @param {Shadow} shadow
       * @param {Object} props
       * * @param {string} tag
       * @param {string} ns
       */
      initialize: function initialize(shadow, props, tag, ns) {
//        throw new Error('initialize() must be implemented by subclass!');
        shadow.guid = ++uid;
        shadow._secrets = {}; //TODO:
        shadow.update = shadow.update.bind(shadow); //TODO: defineProp
        shadow.render = shadow.render.bind(shadow); //TODO: defineProp
        shadow.invalidate = shadow.invalidate.bind(shadow);
        //shadow._update = Shadow.update.bind(null, shadow);

        Shadow.initSkin(shadow, tag, ns);

        if (Skin.isElement(shadow.$skin)) {
          defineMembersOf(shadow);
        }

        Accessor.initialize(shadow, props);
      },

      /**
       * Create $skin for the shadow.
       *
       * @param {Shadow} shadow
       * @param {string} tag
       * @param {string} ns ''/'svg'/'math'
       */
      initSkin: function initSkin(shadow, tag, ns) {
        ObjectUtil_defineProp(shadow, '$skin', {value: tag/* !== 'TEXT'*/ ? Skin.createElement(tag, ns) : Skin.createText('')}); //TODO: $shin._secrets = {$skin: ...}
//        shadow.$skin._shadow = shadow; //TODO: strict
        if (Skin.canExtend(shadow.$skin)) {
          ObjectUtil_defineProp(shadow.$skin, '_shadow', {value: shadow});
        }
      },

      clean: function clean(shadow) {
        shadow.isInvalid = false;
        DirtyChecker_clean(shadow); //delete shadow._dirty;
      },

      /**
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
        var $skin = shadow.$skin;
        if (!$skin) { return; }

        var action = shadow._actions[type];

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
        var $skin = shadow.$skin;
        if (!$skin) { return; }

        var action = shadow._actions[type];

        if (action.listener && Skin.mayDispatchEvent($skin, type)) {
          Skin.removeEventListener($skin, type, action.listener, useCapture);

          delete action.listener;
        }
      }

    }
  });

  Exact.Shadow = Shadow;
  
})();
