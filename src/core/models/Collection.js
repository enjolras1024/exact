//######################################################################################################################
// src/core/models/Collection.js
//######################################################################################################################
(function() {

  var Watcher = Exact.Watcher;

  function Collection() {//TODO: changed.length
    var l = arguments.length, n = arguments[0];

    if (l) {
      if (l === 1 && typeof n === 'number') {
        this.push.apply(this, new Array(n));
      } else {
        this.push.apply(this, arguments);
      }
    }
  }

  var base = Array.prototype;

  function invalidate(collection, key) {
    collection.isInvalidated = true;
    collection.send(key ? 'changed.' + key : 'changed'); //collection.send(key ? 'change.' + key : 'change);

    //if (collection.onChange) { // TODO: remove
    //  collection.onChange();
    //}
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
        collection.isInvalidated = false;
      }
    },

    //type: Object,

//    clean: function() {
//      this.isInvalidated = false;
//    },

    push: function() {
      if (arguments.length) {
        base.push.apply(this, arguments);
        invalidate(this, 'length');
      }

      return this.length;
    },

    pop: function() {
      if (this.length) {
        var popped = base.pop.call(this);
        invalidate(this, 'length');
      }

      return popped;
    },

    unshift: function() {
      if (arguments.length) {
        base.unshift.apply(this, arguments);
        invalidate(this, 'length');
      }

      return this.length;
    },

    shift: function() {
      if (this.length) {
        var shifted = base.shift.call(this);
        invalidate(this, 'length');
      }

      return shifted;
    },

    splice: function() {
      var n = this.length;
      var spliced = base.splice.apply(this, arguments);

      invalidate(this, this.length !== n ? 'length' : '');

      return spliced;
    },

    sort: function(comparator) {
      base.sort.call(this, comparator);

      invalidate(this);

      return this;
    },

    reverse: function() {
      base.reverse.call(this);

      invalidate(this);

      return this;
    },

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

      //return this;
    },

    reset: function(items) {
      var i, n, m, flag;
      n = this.length;
      m = items.length;


      if (n > m) {
        base.splice.call(this, m, n);
        flag = true;
      }

      for (i = 0;  i < m; ++i) {
        if (!flag && this[i] !== items[i]) {
          flag = true;
        }

        this[i] = items[i];
      }

      this.length = m;

      if (flag) {
        invalidate(this, m != n ? 'length' : '');
      }

      //return this;
    },

    insert: function(item, before) { //TODO: add type checker, Children
      //if (!(item instanceof this.type) || (arguments.length > 1 && !(before instanceof this.type))) {
      ////if (!(item instanceof Object) || (arguments.length > 1 && !(before instanceof Object))) {
      //  throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      //}

      var i, n;

      n = this.length;

      if (before && before === item) { return this; }

      for (i = 0; i < n; ++i) {
        if (this[i] === item) {
          base.splice.call(this, i, 1);
          n = this.length;// <=> --n;
          break;
        }
      }

      if (before != null) {
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

      invalidate(this, 'length');

      //return this;
    },

    remove: function(item) { //TODO: can be number index
      //if (!(item instanceof this.type)) {
      ////if (!(item instanceof Object)) {
      //  throw new TypeError("Failed to execute `remove` on `Collection`: the item to be removed must be object.");
      //}

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

      invalidate(this, 'length');

      //return this;
    },

    replace: function(item, existed) {
      //if (!(item instanceof this.type) || !(existed instanceof this.type)) {
      ////if (!(item instanceof Object) || !(existed instanceof Object)) {
      //  throw new TypeError("Failed to execute `insert` on `Collection`: 2 arguments must be object.");
      //}

      if (item === existed) { return /*this*/; }

      var i, n;

      for (i = 0, n = this.length; i < n; ++i) {
        if (this[i] === existed) {
          break;
        }
      }

      if (i === n) { //TODO: silent
        throw new Error('The item to be replaced is not existed in this collection');
      }

      this.set(i, item);

      invalidate(this);

      //return this;
    }
  });

  Exact.Collection = Collection;

})();
