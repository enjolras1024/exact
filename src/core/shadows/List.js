//######################################################################################################################
// src/core/shadows/List.js
//######################################################################################################################
(function() {
  'use strict';

  var Component = Exact.Component;

  function checkAdapterOf(list) {
    var itemAdapter = list.itemAdapter, itemTemplate = list.itemTemplate;

    if (!itemAdapter) {
      if (itemTemplate) {
        itemAdapter = Exact.defineClass({
          extend: Component,
          statics: {
            imports: {},
            template: list.itemTemplate//this.contents[0].$skin
          }
        });

        list.itemAdapter = itemAdapter;
      } /*else {
        itemAdapter = Exact.defineClass({
          extend: Component,
          statics: {
            imports: {},
            //$template: "`item`"
            $template: '<span>`${$.item}`</span>'
          }
        });
      }*/

      //list.itemAdapter = itemAdapter;
    }

  }

  function List() {
    Component.call(this, arguments);
  }

  Exact.defineClass({
    constructor: List, extend: Component,

    statics: {
      fullName: 'List',
      //imports: {},
      $template: '<ul></ul>'
    },

    register: function() {
      //this.refresh = this.refresh.bind(this);
    },

    ready: function() {
      //this.on('change.items', this.invalidate);
      //this.on('change.itemAdapter', function() {
      //  console.log('change.itemAdapter');
      //});
      //this.on('refresh', this.refresh.bind(this));
    },


    refresh: function() {

      var i, n, m, item, items = this.items, itemAdapter, child, children = this.children, contents = [];

      if (!items) { return; }

      n = items.length;
      m = children.length;

      checkAdapterOf(this);

      itemAdapter = this.itemAdapter;

      if (!itemAdapter) {return;}

      for (i = 0; i < n; ++i) {
        item = items[i];
        //item._toIndex = i;
        item._fromIndex = -1;
        //children.push(i, new itemAdapter({item: items[i]}));
      }

      for (i = 0; i < m; ++i) {
        item = children[i].item;
        if ('_fromIndex' in item) {
          item._fromIndex = i;
        }
      }

      for (i = 0; i < n; ++i) {
        item = items[i];
        if (item._fromIndex >= 0 ) {
          child = children[item._fromIndex];
          contents.push(child);
        } else {

          var content = new itemAdapter({item: item});

          contents.push(content);

          this.send('itemAdded', item, content);
        }

        delete item._fromIndex;
      }

      for (i = 0; i < n; ++i) {
        if (i < m) {
          children.set(i, contents[i]);
        } else {
          children.push(contents[i]);
        }
      }

      if (m > n) {
        children.splice(n);
      }

    }
  });

  Exact.List = List;

})();
