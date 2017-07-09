var App = Exact.defineClass({
  extend: Exact.Component,
  statics: {
    descriptors: ['what'],
    template: '<div></div>'
  }
});

var app = Exact.Component.create(App);
var h1 = Exact.Element.create('h1');
var text = Exact.Text.create('');

h1.style.set('color', '#0066dd');
h1.children.insert(text);
app.children.insert(h1);

app.on('changed.what', function() {
  text.set('data', 'Hello, ' + app.what + '!');
});

app.save({what: 'World'});  // Or app.set('what', 'World'). It will dispatch event `changed.what`

app.attach(Exact.Skin.query('#app'));

console.log('do something like:');
console.log('app.what = "Earth";');
console.log('app.set("what", "Universe");');
console.log('app.save({what: "Everything"});');