(function() {
  var Skin = Exact.Skin;
  var Store = Exact.Store;
  var Collection = Exact.Collection;
  var Component = Exact.Component;

  var defineClass = Exact.defineClass;

  ENJ = {};

  ENJ.Adapter = defineClass({
    extend: Component,

    statics: {
      $template: Skin.query(document, '.template .adapter')/*.trim()*/
      //$template: Skin.query(jQuery(document), '.adapter-template').text()/*.trim()*/
    },

    register: function() {
      Exact.help(this).bind('onSubmit', 'onEdit', 'onEnter', 'onEsc', 'onBlur', 'onDestroy', 'onToggle');
    },

    edit: function() {
      this.backup = this.item.title;
      this.item.set('selected', true);

      this.editor.set('value', this.backup);
      this.editor.focus();
      //this.editor.$skin.focus();
      //requestAnimationFrame(this.editor.$skin.focus.bind(this.editor.$skin));
    },

    //onEdit: function () {
    //  //console.log('onEdit');
    //  this.backup = this.item.title;
    //  this.item.set('selected', true);
    //  this.editor.set('value', this.backup);
    //  this.editor.$skin.focus();
    //},

    onEsc: function(event) {
      //this.editor.set('value', this.backup);
      //console.log(event);
      this.cancel = true;
      this.editor.blur();
      //this.editor.$skin.blur();
      //this.item.set('title', this.backup);
    },

    onEnter: function(event) {
      //console.log('oooo');
      this.onSubmit(event.target.value);
    },

    onBlur: function(event) {
      if (this.cancel) {
        this.onSubmit(this.backup);
        this.cancel = false;
      } else {
        this.onSubmit(event.target.value);
      }

      //this.onSubmit(this.editor.value);
    },

    onSubmit: function(title) {
      //this.editor.set('value', '');
      this.item.set({
        selected: false,
        title: title
      });


    },

    onToggle: function() {
      this.item.set('completed', !this.item.completed);
    },

    onDestroy: function() {
      this.emit('destroy', this.item);
    }
  });

  ENJ.TodoApp = defineClass({
    extend: Component,

    statics: {
      imports: {
        ENJ: ENJ,
        List: Exact.List,
        display: function(visible) {
          return visible ? '' : 'none';
        },
        pluralize: function(num, str) {
          return ' ' + str + (num > 1 ? 's': '');
        }
      },
      $template: Skin.query(document, '.template .todoapp')/*.trim()*/
      //$template: Skin.query(jQuery(document), '.todoapp-template').text()/*.trim()*/
    },

    defaults: function() {
      return {
        remainingCount: 0
      }
    },

    filtering: function(todos) {
      var filter = this.filter || 'all';
      var arr = todos.filter(function(todo) {
        return filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed);
      });
      //console.log(filter, arr);
      return arr;
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

      //Exact.Shadow.refresh(this);
    },

    register: function() {
      this.todos = new Collection();


      Exact.help(this).bind('onEnter', 'onCheck', 'onSelect', 'allDone', 'filtering', 'removeTodo');
    },

    refresh: function() {

      this.set('remainingCount', this.todos.filter(function(item){
        return !item.completed;
      }).length);

    },

    get allDone() {
      return this.todos.length > 0 && this.todos.filter(function(item){
        return item.completed;
      }).length === this.todos.length;
    },

    removeTodo: function(todo) {
      this.todos.splice(this.todos.indexOf(todo), 1);
    },

    clearCompleted: function() {
      console.log('clearCompleted', this);
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

      //if (value && event.which ===  13 ) {
        event.target.value = '';

        this.todos.push(new Store({
          completed: false,
          selected: false,
          title: value
        }));

        //console.log(this.todos);
      //}
    },

    onSelect: function(event) {
      var el =  event.target;
      if (el.tagName.toLowerCase() === 'a') {
        this.set('filter', el.textContent.toLowerCase());
        //console.log('filter', this.filter);
      }
    }
  });

  var todoApp = Component.create(ENJ.TodoApp);

  //document.getElementById('app-shell').appendChild(todoApp.$skin);
  document.body.appendChild(todoApp.$skin);
})();
