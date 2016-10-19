//######################################################################################################################
// src/res.js
//######################################################################################################################
(function() {
  'use strict';

  var RES = Exact.RES;

  var Binding = Exact.Binding;
  var VariableUtil = Exact.VariableUtil;
  var ActionParser = Exact.ActionParser;
  var BindingParser = Exact.BindingParser;
  var BindingTemplate = Exact.BindingTemplate;

  //var BINDING_SYMBOLS = {
  //  ONE_WAY: '$', ONE_TIME: '&', TWO_WAY: '#'//, ANY_WAY: '@'
  //};
  //
  //(function() {
  //  var key, symbol;
  //
  //  function getBindingParser(symbol) {
  //    return function(config, imports) {
  //      //var info =  BindingTemplate.parse(symbol, config, imports);
  //      //return VariableUtil.createVar(Binding, info.options);
  //      return BindingParser.parse(symbol, config, imports);
  //    };
  //  }
  //
  //  for (key in BINDING_SYMBOLS) {
  //    if (BINDING_SYMBOLS.hasOwnProperty(key)) {
  //      symbol = BINDING_SYMBOLS[key];
  //      RES.register(symbol, {
  //        parse: getBindingParser(symbol)
  //      });
  //    }
  //  }
  //})();
  //
  //RES.register('@', {
  //  parse: function(expr) {
  //    return ActionParser.parse(expr);
  //  }
  //});

  //TODO: register some converters


})();

