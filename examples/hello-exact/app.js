var Component = Exact.Component;

var App = Exact.defineClass({
  extend: Component,
  statics: {
    descriptors: ['what'], // or {what: null}, so `what` is bindable
    template: '<div><h1>Hello, @{ $.what }!</h1></div>'
  }
});

var app = Component.create(App, {what: 'Exact'});

app.attach(Exact.Skin.query('#app'));

console.log('do something like:');
console.log('app.what = "Earth";');
console.log('app.set("what", "Universe");');
console.log('app.save({what: "Everything"});');