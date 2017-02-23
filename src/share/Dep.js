//######################################################################################################################
// src/share/Dep.js
//######################################################################################################################
(function() {

  var target, collection;

  Exact.Dep = {
    is: function() {
      return !!target;
    },

    begin: function begin(instance) {
      collection = [];
      target = instance;
      return collection;
    },

    add: function(source, key) {
      collection.push({
        source: source,
        key: key
      });
    },

    end: function end() {
      collection = null;
      target = null;
    }
  };

})();
