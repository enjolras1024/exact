(function() {
  var Skin = Exact.Skin;
  var Store = Exact.Store;
  var Collection = Exact.Collection;
  var Component = Exact.Component;

  var defineClass = Exact.defineClass;

  var ENJ = {
    read: function() {
      var item = localStorage.getItem('todos');

      if (item) {
        var todos = JSON.parse(item);
        var collection = new Collection();
        for (var i = 0; i < todos.length; ++i) {
          collection.push(new Store(todos[i]));
        }
        return collection;
      }

      return Collection.from([]);
    },
    save: function(collection) {
      console.log(collection);
      localStorage.setItem('todos', JSON.stringify(collection.slice(0)));
    }
  };

  ENJ.Adapter = defineClass({
    extend: Component,

    statics: {
      $template: Skin.query(document, '.template .adapter'),
      resources: {
        CheckBox: Exact.CheckBox
      }
    },

    register: function() {
      Exact.help(this).bind('onSubmit', 'onEdit', 'onEnter', 'onEsc', 'onBlur', 'onDestroy', 'onToggle');
    },

    edit: function() {
      this.backup = this.item.title;
      this.item.set('selected', true);

      this.editor.set('value', this.backup);
      this.editor.focus();
    },

    onEsc: function(event) {
      this.cancel = true;
      this.editor.blur();
    },

    onEnter: function(event) {
      this.onSubmit(event.target.value);
    },

    onBlur: function(event) {
      if (this.cancel) {
        this.onSubmit(this.backup);
        this.cancel = false;
      } else {
        this.onSubmit(event.target.value);
      }
    },

    onSubmit: function(title) {
      this.item.save({
        selected: false,
        title: title
      });
    },

    onToggle: function() {
      //this.item.set('completed', !this.item.completed);
    },

    onDestroy: function() {
      this.emit('destroy', this.item);
    }
  });

  ENJ.TodoApp = defineClass({
    extend: Component,

    statics: {
      resources: {
        ENJ: ENJ,
        List: Exact.List,
        display: function(visible) {
          return visible ? '' : 'none';
        },
        pluralize: function(num, str) {
          return ' ' + str + (num > 1 ? 's': '');
        }
      },
      $template: Skin.query(document, '.template .todoapp')
    },

    defaults: function() {
      return {
        remainingCount: 0
      }
    },

    filtering: function(todos) {
      var filter = this.filter || 'all';
      return todos.filter(function(todo) {
        return filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed);
      });
    },

    ready: function() {
      var invalidate = this.invalidate;
      var removeTodo = this.removeTodo;

      //this.todos.on('change', invalidate);
      this.todos.onChange = invalidate;

      this.list.on('itemAdded', function(event, todo, adapter) {
        todo.on('changed.completed', invalidate);
        adapter.on('destroy', removeTodo);
      });
    },

    register: function() {
      this.todos = ENJ.read();
      Exact.help(this).bind('onEnter', 'onCheck', 'onSelect', 'allDone', 'filtering', 'removeTodo', 'refresh');
    },

    refresh: function() {
      // TODO: should not set self here. Instead, set children.
      this.set('remainingCount', this.todos.filter(function(item){
        return !item.completed;
      }).length);

      ENJ.save(this.todos);
    },

    get allDone() {
      return this.todos.length > 0 && this.todos.filter(function(item){
        return item.completed;
      }).length === this.todos.length;
    },

    removeTodo: function(todo) {
      this.todos.splice(this.todos.indexOf(todo), 1);
      //ENJ.save(this.todos);
    },

    clearCompleted: function() {
      for (var i = this.todos.length - 1; i >= 0; --i) {
        if (this.todos[i].completed) {
          this.todos.splice(i, 1);
        }
      }
    },

    onCheck: function(event) {
      this.todos.forEach(function(todo) {
        todo.set('completed', event.target.checked);
      });
    },

    onEnter: function(event) {
      var value = event.target.value.trim();

      event.target.value = '';

      if (value) {
        this.todos.push(new Store({
          completed: false,
          selected: false,
          title: value
        }));
        //ENJ.save(this.todos);
        //localStorage.setItem('todos', JSON.stringify(this.todos.slice(0)));
      }
    },

    onSelect: function(event) {
      //var el =  event.target;
      //if (el.tagName.toLowerCase() === 'a') {
      //  this.set('filter', el.textContent.toLowerCase());
      //  //console.log('filter', this.filter);
      //}
    }
  });

  var app = Component.create(ENJ.TodoApp);

  var filters = {
    all: true, active: true, completed: true
  };

  // handle routing
  function onHashChange () {
    var filter = window.location.hash.replace(/#\/?/, '');
    if (filters[filter]) {
      app.set('filter', filter);
    } else {
      window.location.hash = '';
      app.set('filter', 'all');
    }
  }

  window.addEventListener('hashchange', onHashChange);
  onHashChange();


  document.getElementById('app-shell').appendChild(app.$skin);
})();