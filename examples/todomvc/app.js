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
        return JSON.parse(item);
      }
    },
    save: function(todos) {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  };

  ENJ.Adapter = defineClass({
    extend: Component,

    statics: {
      $template: Skin.query(document, '.template .adapter')
    },

    register: function() {
      Exact.help(this).bind('edit', 'destroy', 'doneEdit', 'cancelEdit');
    },

    edit: function() {
      this.set('backup', this.item.title);
      this.editor.set('value', this.backup);
      this.editor.focus();
    },

    doneEdit: function(event) {
      this.submit(event.target.value.trim());
    },

    cancelEdit: function(event) {
      this.submit(this.backup);
    },

    submit: function(title) {
      if (!this.backup) { return; }

      this.set('backup', '');
      
      if (title) {
        this.item.set("title", title);
      } else {
        this.destroy();
      }
    },

    destroy: function() {
      this.emit('destroy', this.item);
    }
  });

  ENJ.TodoApp = defineClass({
    extend: Component,

    statics: {
      descriptors: [{
        allDone: {
          depends: ['remainingCount'],
          get: function() {
            return this.remainingCount === 0;
          },
          set: function(value) {
            this.todos.forEach(function(todo) {
              todo.set('completed', value);
            });
          }
        },
        remainingCount: {
          get: function() {
            return this.todos.filter(function(item){
              return !item.completed;
            }).length;
          }
        }
      }],
      resources: {
        ENJ: ENJ,
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
        todos: new Collection(),
        newTitle: '',
        remainingCount: 0
      }
    },

    filtering: function(todos) {
      var filter = this.filter || 'all';
      return todos.filter(function(todo) {
        return filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed);
      });
    },

    register: function() {
      Exact.help(this).bind('onEnter', 'filtering', 'removeTodo', 'clearCompleted');
    },

    ready: function() {
      var invalidate = this.invalidate;
      var removeTodo = this.removeTodo;

      this.todos.onChange = invalidate;

      var records = ENJ.read();
      if (records) {
        for (var i = 0, n = records.length; i < n; ++i) {
          this.addTodo(Store.from(records[i]));
        }
      }

      this.list.on('itemAdded', function(event, todo, adapter) {
        adapter.on('destroy', removeTodo);
      });

      this.list.on('itemRemoved', function(event, todo, adapter) {
        adapter.off('destroy', removeTodo);
      });
    },

    refresh: function() {
      this.send('changed.remainingCount');
      ENJ.save(this.todos.slice(0));
    },

    addTodo: function(todo) {
      todo.on('changed', this.invalidate);
      this.todos.push(todo);
    },

    removeTodo: function(todo) {
      todo.off('changed', this.invalidate);
      this.todos.splice(this.todos.indexOf(todo), 1);
    },

    clearCompleted: function() {
      for (var i = this.todos.length - 1; i >= 0; --i) {
        if (this.todos[i].completed) {
          this.todos.splice(i, 1);
        }
      }
    },

    onEnter: function() {
      var title = this.newTitle.trim();

      this.set('newTitle', '');

      if (title) {
        this.addTodo(Store.from({
          completed: false,
          title: title
        }));
      }
    }
  });

  var app = Component.create(ENJ.TodoApp);

  var filters = {
    all: true, active: true, completed: true
  };

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