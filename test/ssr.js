var $ = require('cheerio');
var Exact = require('../dist/exact.js');
Exact.Skin = require('../dist/exact-skin-cheerio.js');

//global.Exact.Skin = Exact.Skin;

var $skin = $('fine<div class="active" title="hi">ok</div><input type="text" value="2"><!--ok-->');
//
//$skin.prop('className', 'success');
//
//console.log($('<input type="checkbox" checked value="man">').attr('value', 'oo'));

//console.log($('<p>').append('ok'));
//console.log($('<body></body>').append($('<p>')).html());
//console.log($('<body></body>').append($('<span>fine</span>').contents().eq(0)).html());
//console.log($('<span></span>').contents().eq(0));
//console.log($skin);
////console.log($skin.eq(1).val(3));
//console.log($('<body></body>').append($skin).html());

//console.log($skin[0].children);



var Component = Exact.Component;

function Box() {
  Component.call(this);
}

Exact.defineClass({
  constructor: Box, extend: Component,
  statics: {
    descriptors: {value: null},
    template: '<div><input type="text" value=""><span>@{$.value}</span></div>'
  }
});

function App() {
  Component.call(this);
}

Exact.defineClass({
  constructor: App, extend: Component,
  statics: {
    defaults: function() {
      return {
        value: 'ok'
      }
    },
    resources: {
      Box: Box
    },
    template: '<div id="app">input:<div x-type="Box" value@="$.value"></div></div>'
  }
});

var app = new App();
app.set('value', 'fine');
app.attach(Exact.Skin.parse('<div></div>')[0]);

//console.log(app._dirty);
//Exact.Shadow.refresh(app);
//console.log(Exact.Skin.renderToString(app.$skin));

Exact.setImmediate(function() {

  console.log(app.value);
  //app.$skin.attr('class', 'app');
  //Exact.Skin.setProp(app.$skin, 'class', 'app');
  //console.log(app.$skin);
  //console.log($('<body></body>').append(app.$skin).html());
  console.log(Exact.Skin.renderToString(app.$skin));
});
////
//console.log(app.$skin);
//console.log(app.$skin.append('ok'));
//console.log($('<body></body>').append(app.$skin).html());

//var Exact = require('exact');
//Exack.Skin = require('exact-skin-cheerio');

var Demo = Exact.defineClass({
  extend: Exact.Component,
  statics: {
    template: '<div title@="$.tooltip">@{ $.message }</div>',
    descriptors: ['tooltip', 'message']
  }
});

var demo = Exact.Component.create(Demo, {tooltip: '123', message: '456'});

demo.attach(Exact.Skin.parse('<div></div>')[0]);

setImmediate(function() {
  console.log(Exact.Skin.renderToString(demo.$skin));
});