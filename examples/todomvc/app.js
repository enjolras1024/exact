(function() {
  var Store = Exact.Store;
  var Component = Exact.Component;
  var Collection = Exact.Collection;

  var id = 0;

  var STATUS = {
    ALL: 'all', ACTIVE: 'active', COMPLETED: 'completed'
  };

  function filter(todos, status) {
    return todos.filter(function(todo) {
      return status === STATUS.ALL || (status === STATUS.COMPLETED ? todo.completed : !todo.completed);
    });
  }

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

  ENJ.TodoAdapter = Exact.defineClass({
    extend: Component,

    statics: {
      template: Exact.Skin.query('.template .todo-adapter'),

      defaults: function() {
        return {
          completed: false,
          editing: false,
          label: '',
          text: ''
        }
      }
    },

    register: function() {
      Exact.help(this).bind('onToggle', 'onChange');
    },

    onToggle: function(event) {
      this.set('completed', event.target.checked);
    },

    onChange: function(event) {
      this.set('text', event.target.value.trim());
    },

    startEditing: function() {
      this.set('text', this.label);
      this.set('editing', true);
      this.editor.focus();
    },

    doneEditing: function() {
      if (this.editing) {
        this.submit(this.text);
      }

      this.cancelEditing();
    },

    cancelEditing: function() {
      this.set('editing', false);
    },

    submit: function(text) {
      if (text) {
        this.set('label', text);
      } else {
        this.destroy();
      }
    },

    destroy: function() {
      this.send('destroy');
    }
  });

  ENJ.TodoApp = Exact.defineClass({
    extend: Component,

    statics: {
      defaults: function() {
        return {
          todos: Collection.from([]),
          status: STATUS.ALL,
          newTodo: '',
          remainingCount: 0
        }
      },

      descriptors: {
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
        }
      },

      resources: {
        filter: filter,
        display: function(visible) {
          return visible ? '' : 'none';
        },
        pluralize: function(num, str) {
          return str + (num !== 1 ? 's' : '');
        },
        TodoAdapter: ENJ.TodoAdapter
      },

      template: Exact.Skin.query('.template .todoapp')
    },

    register: function() {
      Exact.help(this).bind('onEnter', 'onChange', 'onToggle');
    },

    ready: function() {
      var records = ENJ.read();

      if (records) {
        for (var i = 0, n = records.length; i < n; ++i) {
          this.addTodo(Store.create(records[i]));
        }
      }
    },

    refresh: function() {
      var remainingCount = this.remainingCount;

      this.set('remainingCount', this.todos.length - filter(this.todos, STATUS.COMPLETED).length);

      if (this.status !== STATUS.ALL && this.remainingCount !== remainingCount ) {
        this.send('changed.todos');
      }

      ENJ.save(this.todos.slice(0));
    },

    addTodo: function(todo) {
      todo.on('changed.completed', this.invalidate);
      todo.id = ++id;
      this.todos.insert(todo);
      this.invalidate();
    },

    removeTodo: function(todo) {
      this.todos.remove(todo);
      this.invalidate();
      todo.off();
    },

    clearCompleted: function() {
      for (var i = this.todos.length - 1; i >= 0; --i) {
        if (this.todos[i].completed) {
          this.todos.splice(i, 1);
        }
      }
    },

    onToggle: function(event) {
      this.set('allDone', event.target.checked);
    },

    onChange: function(event) {
      this.set('newTodo', event.target.value.trim());
    },

    onEnter: function(event) {
      if (this.newTodo) {
        this.addTodo(Store.create({
          label: this.newTodo,
          completed: false
        }));
      }

      this.set('newTodo', '');
    }
  });

  var app = Component.create(ENJ.TodoApp);

  function onHashChange () {
    var hash = window.location.hash;
    var status = STATUS[hash.replace(/#\/?/, '').toUpperCase()];
    app.set('status', status || STATUS.ALL);
  }

  onHashChange();

  window.onhashchange = onHashChange;

  app.attach(Exact.Skin.query('#todoapp'));
})();