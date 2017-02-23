//######################################################################################################################
// src/core/shadows/Shadow.js
//######################################################################################################################
(function() {

  var Skin = Exact.Skin;

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
      Object.defineProperty(this, '_attrs', {value: createContainer(this), configurable: true});
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
    //  Object.defineProperty(this, '_props', {value: createContainer(this), configurable: true});
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
      Object.defineProperty(this, '_style', {value: createContainer(this), configurable: true});
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
      Object.defineProperty(this, '_classes', {value: createContainer(this), configurable: true});
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
      Object.defineProperty(this, '_children', {value: createCollection(this), configurable: true});
    }
    return this._children;
  }

  ///**
  // * contents getter
  // *
  // * @returns {Collection}
  // */
  //function getContents() {
  //  if (!this._contents && Skin.isElement(this.$skin)) {
  //    Object.defineProperty(this, '_contents', {value: createCollection(this), configurable: true});
  //  }
  //  return this._contents;
  //}

  // lazy mode when getter is supported
  var defineMembersOf = function(shadow) {
    Object.defineProperty(shadow, '_props', {
      value: {}, writable: false, enumerable: false, configurable: false
    });
    Object.defineProperty(shadow, 'props', {get: getProps});

    if (shadow.tag) {
      Object.defineProperty(shadow, 'attrs', {get: getAttrs});
      Object.defineProperty(shadow, 'style', {get: getStyle});
      Object.defineProperty(shadow, 'classes', {get: getClasses});
      Object.defineProperty(shadow, 'children', {get: getChildren});
      //ObjectUtil.defineProperty(shadow, 'contents', {get: getContents});  //TODO: set('contents', []) is ok
    }
  };

  if ('__ENV__' === '<ES5') {
    // immediate mode when getter is not supported
    defineMembersOf = function(shadow) {
      Object.defineProperty(shadow, '_props', {
        value: {}, writable: false, enumerable: false, configurable: false
      });
      shadow.props = shadow._props;

      if (shadow.tag) {
        Object.defineProperty(shadow, 'attrs', {value: createContainer(shadow)});
        Object.defineProperty(shadow, 'style', {value: createContainer(shadow)});
        Object.defineProperty(shadow, 'classes', {value: createContainer(shadow)});
        Object.defineProperty(shadow, 'children', {value: createCollection(shadow)});
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
    var ns = shadow.ns, tag = shadow.tag, _shadow;

    if (!$skin || tag !== Skin.getTagName($skin) || ns !== Skin.getNameSpace($skin)
      || ((_shadow = $skin ? Skin.getShadow($skin) : null) && _shadow !== shadow)) {
      $skin = tag ? Skin.createElement(tag, ns) : Skin.createText('');
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

      //this.send('updated');

      var $skin = this.$skin;

      if ($skin) {
        var child, children = this._children, $children;
        // TODO: child._depth = this._depth + 1;
        if (children && children.isInvalidated) {
          for (var i = 0, n = children.length; i < n; ++i) {
            child = children[i];
            if (!child.$skin) {
              $children = $children || Skin.getChildren($skin);
              initSkin(child, $children[i]);
            }
          }
        }
      } else {
        initSkin(this);
      }

      Schedule.append(this); //this.render(); TODO: immediate rendering is ok

      this.isInvalidated = false;

      this.send('updated');
    },

    /**
     * Render the dirty parts of this shadow to $skin
     */
    render: function render() {
      var $skin = this.$skin;

      if (!$skin) { return; }

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
              console.error("You'd better not use innerHTML and children together.");
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
    },

    /**
     *
     * @param {HTMLElement} $skin
     */
    attach: function attach($skin) {
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
      Object.defineProperty(this, '$skin', {
        value: $skin,
        writable: true,
        enumerable: false,
        configurable: true
      });

      Skin.setShadow($skin, this);

      // finish
      var type, action, actions = this._actions;

      if (actions) {
        for (type in actions) {
          if (!actions.hasOwnProperty(type)) { continue; }

          action = actions[type];

          if (action) {
            Shadow.addEventListener(this, action, type);
          }
        }
      }

      this.invalidate();
      //this.send('attached');
      //return this;
    },

    /**
     *
     */
    detach: function detach() {
      var type, action, actions = this._actions, $skin = this.$skin;

      if (actions) {
        for (type in actions) {
          if (!actions.hasOwnProperty(type)) { continue; }

          action = actions[type];

          if (action) {
            Shadow.removeEventListener(this, action, type);
          }
        }
      }

      Skin.setShadow($skin, null);

      this.$skin = null;
      //this.send('detached');
      //return this;
    },

    toString: function toString() {
      var constructor = this.constructor;
      return (constructor.fullName || constructor.name) + '<' + this.tag + '>(' + this.guid + ')';
    },

    blur: function blur() { //TODO: remove
      var $skin = this.$skin;

      $skin && setImmediate(function() {
        Skin.call($skin, 'blur');
      });
      //return this;
    },

    focus: function focus() { //TODO: remove
      var $skin = this.$skin;

      $skin && setImmediate(function() {
        Skin.call($skin, 'focus');
      });
      //return this;
    },

    get: function(key) {
      return this._props[key];
    },
    
    set: function set(key, val) {
      var props = this._props;
    
      var old = props[key];
    
      if (val !== old) {
        props[key] = val;
    
        if ('__ENV__' === '<ES5') {
          this[key] = val;
        }
    
        DirtyMarker.check(this, key, val, old);

        this.invalidate();
      }
    },

    statics: {
      /**
       * @param {Shadow} shadow
       * @param {string} tag
       * @param {string} ns
       */
      initialize: function initialize(shadow, tag, ns) {
        shadow.invalidate = shadow.invalidate.bind(shadow);

        Object.defineProperty(shadow, 'guid', {
          value: ++guid, writable: false, enumerable: false, configurable: false
        });

        Object.defineProperty(shadow, 'tag', {
          value: tag, writable: false, enumerable: false, configurable: false
        });

        Object.defineProperty(shadow, 'ns', {
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
        }

        if (shadow.release) {
          shadow.release();
        }
      },

      addEventListener: function(shadow, action, type) {
        var $skin = shadow.$skin;

        if (!$skin) { return; }

        if (Skin.mayDispatchEvent($skin, type)) { // TODO: No problem?
          action.listener = function (event) {
            shadow.send(Skin.getFixedEvent(event)); // TODO: Shadow.getShadow(domEvent.currentTarget).send(Skin.getFixedEvent(domEvent))
          };

          Skin.addEventListener($skin, type, action.listener, action.useCapture);
        } else {
          action.listener = null;
        }
      },

      removeEventListener: function(shadow, action, type) {
        var $skin = shadow.$skin;

        if (!$skin) { return; }

        if (action.listener && Skin.mayDispatchEvent($skin, type)) {
          Skin.removeEventListener($skin, type, action.listener, action.useCapture);

          delete action.listener;
        }
      }
    }
  });

  Exact.Shadow = Shadow;
  
})();
