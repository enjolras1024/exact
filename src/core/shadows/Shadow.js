//######################################################################################################################
// src/core/shadows/Shadow.js
//######################################################################################################################
(function() {

  //var Skin = ExactSkin || Exact.Skin;

  var Container = Exact.Container;
  var Collection = Exact.Collection;

  var Watcher = Exact.Watcher;
  var Accessor = Exact.Accessor;
  var Schedule = Exact.Schedule;
  var DirtyMarker = Exact.DirtyMarker;

  var setImmediate = Exact.setImmediate;

  var guid = 0;//Number.MIN_VALUE;

  function createContainer(shadow) {
    return Container.create(null, shadow.invalidate);
  }

  function createCollection(shadow) {
    var collection = new Collection();

    collection.on('changed', shadow.invalidate);

    return collection;
  }

  /**
   * attrs getter
   *
   * @returns {Container}
   */
  function getAttrs() {
    if (!this._attrs/* && this.tag*/) {
      Exact.defineProp(this, '_attrs', {value: createContainer(this), configurable: true});
    }
    return this._attrs;
  }

  /**
   * props getter
   *
   * @returns {Container}
   */
  function getProps() {
    //if (!this._props/* && this.tag*/) {
    //  Exact.defineProp(this, '_props', {value: createContainer(this), configurable: true});
    //}
    return this._props;
  }

  /**
   * style getter
   *
   * @returns {Container}
   */
  function getStyle() {
    if (!this._style/* && this.tag*/) {
      Exact.defineProp(this, '_style', {value: createContainer(this), configurable: true});
    }
    return this._style;
  }

  /**
   * classes getter
   *
   * @returns {Container}
   */
  function getClasses() { // TODO: class ClassList extends Container { append, remove }
    if (!this._classes/* && this.tag*/) {
      Exact.defineProp(this, '_classes', {value: createContainer(this), configurable: true});
    }
    return this._classes;
  }

  /**
   * children getter
   *
   * @returns {Collection}
   */
  function getChildren() {
    if (!this._children /*&& this.tag*/) {
      Exact.defineProp(this, '_children', {value: createCollection(this), configurable: true});
    }
    return this._children;
  }

  ///**
  // * contents getter
  // *
  // * @returns {Collection}
  // */
  //function getContents() {
  //  if (!this._contents && ExactSkin.isElement(this.$skin)) {
  //    Exact.defineProp(this, '_contents', {value: createCollection(this), configurable: true});
  //  }
  //  return this._contents;
  //}

  // lazy mode when getter is supported
  var defineMembersOf = function(shadow) {
    Exact.defineProp(shadow, '_props', {
      value: {}, writable: false, enumerable: false, configurable: false
    });
    Exact.defineProp(shadow, 'props', {get: getProps});

    if (shadow.tag) {
      Exact.defineProp(shadow, 'attrs', {get: getAttrs});
      Exact.defineProp(shadow, 'style', {get: getStyle});
      Exact.defineProp(shadow, 'classes', {get: getClasses});
      Exact.defineProp(shadow, 'children', {get: getChildren});
      //ObjectUtil.defineProperty(shadow, 'contents', {get: getContents});  //TODO: set('contents', []) is ok
    }
  };

  if (Exact.env === '<ES5') {
    // immediate mode when getter is not supported
    defineMembersOf = function(shadow) {
      Exact.defineProp(shadow, '_props', {
        value: {}, writable: false, enumerable: false, configurable: false
      });
      shadow.props = shadow._props;

      if (shadow.tag) {
        Exact.defineProp(shadow, 'attrs', {value: createContainer(shadow)});
        Exact.defineProp(shadow, 'style', {value: createContainer(shadow)});
        Exact.defineProp(shadow, 'classes', {value: createContainer(shadow)});
        Exact.defineProp(shadow, 'children', {value: createCollection(shadow)});
        //ObjectUtil_defineProp(shadow, 'contents', {value: createCollection(shadow)});

        shadow._attrs = shadow.attrs;
        shadow._style = shadow.style;
        shadow._classes = shadow.classes;
        shadow._children = shadow.children;
        shadow._contents = shadow.contents;
      }
    }
  }

  function initSkin(shadow, $skin) {
    var ns = shadow.ns, tag = shadow.tag, _shadow, Skin = Exact.Skin;

    if (!$skin || tag !== Skin.getTagName($skin) || ns !== Skin.getNameSpace($skin)
      || ((_shadow = $skin ? Skin.getShadow($skin) : null) && _shadow !== shadow)) {
      $skin = tag ? Skin.createElement(ns, tag, shadow._props && shadow._props.type) : Skin.createText('');
    }

    shadow.attach($skin);

    return $skin;
  }

  function Shadow() {
    throw new Error('Shadow is abstract and can not be instantiated');
  }

  Exact.defineClass({
    constructor: Shadow,

    mixins: [Watcher.prototype, Accessor.prototype, DirtyMarker.prototype],

    /**
     * invalidate this shadow and insert it to the schedule
     */
    invalidate: function invalidate(key, val, old) {
      if (!this.isInvalidated) {
        //console.log('invalidate', this.toString());
        this.isInvalidated = true;
        Schedule.insert(this);
      }
      return this;
    },

    /**
     * Update this shadow and append it to the schedule
     */
    update: function update() { //TODO: enumerable = false
      if (!this.isInvalidated) { return; }
      //console.log('update', this.toString());
      if (this.refresh) {
        this.refresh();
      }

      this.send('updated');

      var $skin = this.$skin;

      //if (!$skin) {
      //  initSkin(this);
      //  $skin = this.$skin;
      //}

      if ($skin) {
        var child, children = this._children, $children;
        // TODO: child._depth = this._depth + 1;
        if (children && children.isInvalidated) {
          for (var i = 0, n = children.length; i < n; ++i) {
            child = children[i];
            if (!child.$skin) {
              $children = $children || Exact.Skin.getChildren($skin);
              initSkin(child, $children[i]);
            }
          }
        }
      } else {
      //  initSkin(this);
      }

      Schedule.append(this); // this.render(); // TODO: immediate rendering is ok

      this.isInvalidated = false;

      return this;
    },

    /**
     * Render the dirty parts of this shadow to $skin
     */
    render: function render() {
      var $skin = this.$skin;

      if (!$skin) { return; }

      var Skin = Exact.Skin;

      var dirty = this._dirty,
        props = this._props,
        attrs = this._attrs,
        style = this._style,
        classes = this._classes,
        children = this._children;

      if (dirty) {
        Skin.renderProps($skin, props, dirty);
        DirtyMarker.clean(this);
      }

      if (this.tag) {
        if (attrs && attrs._dirty) {
          Skin.renderAttrs($skin, attrs, attrs._dirty);
          DirtyMarker.clean(attrs);
        }

        if (style && style._dirty) {
          Skin.renderStyle($skin, style, style._dirty);
          DirtyMarker.clean(style);
        }

        if (classes && classes._dirty) {
          Skin.renderClasses($skin, classes, classes._dirty);
          DirtyMarker.clean(classes);
        }

        if (children && (children.isInvalidated)) {
          if ('__DEV__' === 'development') {
            if (props.hasOwnProperty('innerHTML') && children.length) {
              console.error("You'd better not use innerHTML and children together for ", this); // TODO: check when parsing
            }
          }

          var $removed = Skin.renderChildren($skin, children);

          if ($removed && $removed.length) {
            for (var i = 0, n = $removed.length; i < n; ++i) {
              var $parent = Skin.getParent($removed[i]);
              var shadow = Skin.getShadow($removed[i]);
              if (!$parent && shadow) { // TODO: && !shadow._secrets.reuse
                shadow.detach();
                Shadow.destroy(shadow);
              }
            }
          }

          Collection.clean(children);
        }
      }
      //this.send('rendered');//TODO: beforeRefresh, refreshing
      return this;
    },

    /**
     *
     * @param {HTMLElement} $skin
     */
    attach: function attach($skin) {
      var Skin = Exact.Skin;
      var shadow = Skin.getShadow($skin);
      // check
      if (shadow) {
        if (shadow === this) {
          return;
        } else {
          throw new Error('a shadow can not attach a $skin that has been attached');
        }
      }

      if (this.tag !== Skin.getTagName($skin)) {
        throw new Error('a shadow can not attach a $skin that has a different tag');
      }

      if (this.ns !== Skin.getNameSpace($skin)) {
        throw new Error('a shadow can not attach a $skin that has a different namespace');
      }
      // define
      Exact.defineProp(this, '$skin', {
        value: $skin,
        writable: true,
        enumerable: false,
        configurable: true
      });

      Skin.setShadow($skin, this);

      // finish
      var type, event, action, actions = this._actions;

      if (actions) {
        for (type in actions) {
          if (!actions.hasOwnProperty(type)) { continue; }

          action = actions[type];

          event = Watcher.getFixedEvent(type);

          if (action) {
            Shadow.addEventListener(this, action, event.type, event.capture);
          }
        }
      }

      this.send('attached');

      this.invalidate();

      return this;
    },

    /**
     *
     */
    detach: function detach() {
      var type, event, action, actions = this._actions, $skin = this.$skin;

      if (actions) {
        for (type in actions) {
          if (!actions.hasOwnProperty(type)) { continue; }

          action = actions[type];

          event = Watcher.getFixedEvent(type);

          if (action) {
            Shadow.removeEventListener(this, action, event.type, event.capture);
          }
        }
      }

      Exact.Skin.setShadow($skin, null);

      this.send('detached');

      this.$skin = null;

      return this;
    },

    toString: function toString() {
      var constructor = this.constructor;
      return (constructor.fullName || constructor.name) + '<' + this.tag + '>(' + this.guid + ')';
    },

    blur: function blur() { //TODO: remove
      var $skin = this.$skin;

      $skin && setImmediate(function() {
        Exact.Skin.call($skin, 'blur');
      });

      return this;
    },

    focus: function focus() { //TODO: remove
      var $skin = this.$skin;

      $skin && setImmediate(function() {
        Exact.Skin.call($skin, 'focus');
      });

      return this;
    },

    get: function(key) {
      return this._props[key];
    },
    
    set: function set(key, val) {
      var props = this._props;
    
      var old = props[key];
    
      if (val !== old) {
        props[key] = val;
    
        if (Exact.env === '<ES5') {
          this[key] = val;
        }
    
        DirtyMarker.check(this, key, val, old);

        this.invalidate();
      }

      return this;
    },

    statics: {
      /**
       * @param {Shadow} shadow
       * @param {string} tag
       * @param {string} ns
       */
      initialize: function initialize(shadow, tag, ns) {
        shadow.invalidate = shadow.invalidate.bind(shadow);

        Exact.defineProp(shadow, 'guid', {
          value: ++guid, writable: false, enumerable: false, configurable: false
        });

        Exact.defineProp(shadow, 'tag', {
          value: tag, writable: false, enumerable: false, configurable: false
        });

        Exact.defineProp(shadow, 'ns', {
          value: ns, writable: false, enumerable: false, configurable: false
        });

        defineMembersOf(shadow);
      },

      /**
       * @param {Shadow} shadow
       */
      destroy: function destroy(shadow) {
        shadow.off();

        DirtyMarker.clean(shadow);

        var i, children = shadow._children;
        if (children) {
          for (i = children.length - 1; i >= 0; --i) {
            Shadow.destroy(children[i]);
          }
        }

        var binding, bindings = shadow._bindings; //
        if (bindings) {
          for (i = bindings.length - 1; i >= 0; --i) {
            binding = bindings[i];
            binding.constructor.clean(binding);
          }
          delete shadow._bindings;
        }

        if (shadow.release) {
          shadow.release();
        }
      },

      addEventListener: function(shadow, action, type) {
        var $skin = shadow.$skin, Skin = Exact.Skin;

        if (!$skin) { return; }

        if (Skin.mayDispatchEvent($skin, type)) { // TODO: No problem?
          action.listener = function (event) {
            event.capture = action.capture;
            shadow.send(Skin.getFixedEvent(event)); // TODO: Shadow.getShadow(domEvent.currentTarget).send(Skin.getFixedEvent(domEvent))
          };

          Skin.addEventListener($skin, type, action.listener, action.capture);
        } else {
          action.listener = null;
        }
      },

      removeEventListener: function(shadow, action, type) {
        var $skin = shadow.$skin, Skin = Exact.Skin;

        if (!$skin) { return; }

        if (action.listener && Skin.mayDispatchEvent($skin, type)) {
          Skin.removeEventListener($skin, type, action.listener, action.capture);

          delete action.listener;
        }
      }
    }
  });

  Exact.Shadow = Shadow;
  
})();
