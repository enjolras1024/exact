//######################################################################################################################
// src/core/models/Collection.js
//######################################################################################################################
(function() {

  'use strict';

  var Watcher = Exact.Watcher;

  /**
   *
   * @constructor
   * @internal
   */
  function Collection() {//TODO: ShadowCollection, ShadowList?
    this.push.apply(this, arguments);
  }

  var base = Array.prototype;

  function invalidate(collection, key) {
    collection.isInvalid = true;
    collection.send('changed'); //collection.send(key ? 'change.' + key : 'change);

    if (collection.onChange) {
      collection.onChange();
    }
  }

  Exact.defineClass({
    constructor: Collection,  extend: Array,

    mixins: [Watcher.prototype],

    statics: {
      from: function(contents) {
        var collection = new Collection();

        collection.push.apply(collection, contents);

        return collection;
      },

      clean: function(collection) {
        collection.isInvalid = false;
      }//,
    },

    //invalidate: null,

//    clean: function() {
//      this.isInvalid = false;
//    },

    push: function() {
      base.push.apply(this, arguments);

      invalidate(this);

      return this.length;
    },

    pop: function() {
      var popped = base.pop.call(this);

      invalidate(this);

      return popped;
    },

    unshift: function() {
      base.unshift.apply(this, arguments);

      invalidate(this);

      return this.length;
    },

    shift: function() {
      var shifted = base.shift.call(this);

      invalidate(this);

      return shifted;
    },

    splice: function() {
      var spliced = base.splice.apply(this, arguments);

      invalidate(this);

      return spliced;
    },

    sort: function(comparator) {
      base.sort.call(this, comparator);

      invalidate(this);

      return this;
    },

    //slice: function() { //proxy('slice', true)
    //  var array = base.slice.apply(this, arguments);
    //
    //  var collection = new Collection();
    //
    //  base.push.apply(collection, array);
    //
    //  return collection;
    //},
    //
    //concat: function() { //proxy('concat', true)
    //  var array = base.concat.apply(this, arguments);
    //
    //  var collection = new Collection();
    //
    //  base.push.apply(collection, array);
    //
    //  return collection;
    //},

    //TODO: filter, sort, map, ...

    set: function(index, item) {
      if (index >= this.length) {
        for (var i = this.length; i < index; ++i) {
          base.push.call(this, undefined);
        }

        base.push.call(this, item);
      } else {
        if (this[index] === item) { return this; }
        this[index] = item;
        //base.splice.call(this, index, 1, item);
      }

      invalidate(this);

      return this;
    },

    reset: function(items) {
      var i, n, m, flag;
      n = this.length;
      m = items.length;

      //console.log(n,items,items.length,items[0]);

      if (n > m) {
//        min = m;
        base.splice.call(this, m);
        flag = true;
      } /*else {
       min = n;
       base.push.apply(this, items.slice(min));
       }*/

      for (i = 0;  i < m; ++i) {
        if (!flag && this[i] !== items[i]) {
          flag = true;
        }

        this[i] = items[i];
      }

      this.length = m;

      if (flag) {
        invalidate(this);
      }

      return this;

    },

    insert: function(item, before) { //TODO: before can be number index
      if (!(item instanceof Object) || (arguments.length > 1 && !(before instanceof Object))) {
        throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      }

      var i, n;

      n = this.length;

      if (before && before === item) { return this; }

      for (i = 0; i < n; ++i) {
        if (this[i] === item) {
          //if (i === n-1) {
          //  return this;
          //}

          base.splice.call(this, i, 1);
          n = this.length;// <=> --n;

          break;
        }
      }

      if (before) {
        for (i = 0; i < n; ++i) {
          if (this[i] === before) {
            break;
          }
        }

        if (i === n) { //TODO: silent
          throw new Error('The item before which the new item is to be inserted is not existed in this collection');
        }

        base.splice.call(this, i, 0, item);
      } else {
        base.push.call(this, item);
      }

      invalidate(this);

      return this;
    },

    remove: function(item) { //TODO: can be number index
      if (!(item instanceof Object)) {
        throw new TypeError("Failed to execute `remove` on `Collection`: the item to be removed must be object.");
      }

      var i, n;

      for (i = 0, n = this.length; i < n; ++i) {
        if (this[i] === item) {
          break;
        }
      }

      if (i === n) { //TODO: silent
        throw new Error('The item is to be removed is not existed in this collection');
      }

      if (i < n -1) {
        base.splice.call(this, i, 1);
      } else {
        base.pop.call(this);
      }

      invalidate(this);

      return this;
    },

    replace: function(item, existed) {
      if (!(item instanceof Object) || !(existed instanceof Object)) {
        throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      }

//      if (item === existed) { return this; }

      var i, n;

      for (i = 0, n = this.length; i < n; ++i) {
        if (this[i] === existed) {
          this.set(i, item);
          break;
        }
      }

      if (i === n) { //TODO: silent
        throw new Error('The item to be replaced is not existed in this collection');
      }

//      invalidate(this);

      return this;
    }/*,

    empty: function() {
      this.splice(0);

//      invalidate(this);

      return this;
    }*/
  });

  Exact.Collection = Collection;

})();
