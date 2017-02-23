## [Exact](https://enjolras1024.github.io/exact/)

Exact is an event-driven JavaScript library for building web user interfaces with simple APIs in a flexible way.

> **Events & Bindings:** Exact is [event-driven](https://enjolras1024.github.io/exact/documents/events.html) firstly. Custom events are supported in Exact, besides DOM events. Exact is data-driven based on custom property-changed events. Data bindings embedded in a component template are used for passing data in an intuitive way. They will work when some property-changed events are dispatched.

> **Elements + Components:** Exact elements, which have attributes, classes, style and children, are shadows of DOM elements. An Exact component, as the enhanced edition of Exact element, supports [template](https://enjolras1024.github.io/exact/documents/templates.html), [data binding](https://enjolras1024.github.io/exact/documents/templates.html#data-binding) and [property validation](https://enjolras1024.github.io/exact/documents/components.html#property-validation). When you update the shadow tree, Exact helps you render the dirty parts of a DOM tree in a batch mode asynchronously.

> **Declaration | Procedure:** Usually you can declaratively define a rich template, which includes expressions, for a component class. The once compiled template will be used for initializing a component. Or sometimes you just need an empty template, and add some children, event handlers later (after initialization) in procedure.

#### Overview
An easiest Exact example looks like this:
```javascript
var Component = Exact.Component;

var App = Exact.defineClass({
    extend: Component,
    statics: {
      descriptors: ['what'], // or {what: null}, so `what` is bindable
      template: '<div><h1>Hello, @{ $.what }!</h1></div>'
    }
}); 

Component.create(App, {what: 'World'}).attach(document.getElementById('app'));
```
This example will render "Hello, World!" on the page. We use a declarative template which contanis contents and an one-way binding here for initialization. While you can create a same example in procudure with empty template and more code, just like this:
```javascript
var Text = Exact.Text;
var Element = Exact.Element;
var Component = Exact.Component;

var App = Exact.defineClass({
    extend: Component,
    statics: {
      descriptors: ['what'],
      template: '<div></div>'
    }
});

var app = Component.create(App);
var h1 = Element.create('h1');
var text = Text.create('');

h1.children.insert(text);
app.children.insert(h1);

app.on('changed.what', function() {
    text.set('data', 'Hello, ' + app.what + '!');
});

app.save({what: 'World'});  // Or app.set('what', 'World'). It will dispatch event `changed.what`

app.attach(document.getElementById('app'))
```

[Go here](https://enjolras1024.github.io/exact/examples/) to see more examples.

#### License
Released under the MIT license. Copyright ? 2017 Enjolras1024. All rights reserved.