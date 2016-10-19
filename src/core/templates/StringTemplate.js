//##############################################################################
// src/core/models/StringTemplate.js
//##############################################################################
(function() {
  'use strict';
  
  var Cache = Exact.Cache;
  var DirtyChecker = Exact.DirtyChecker;
  var ExpressionUtil = Exact.ExpressionUtil;

  var Array$join = Array.prototype.join;
  
  
  function Fragment() {
    Cache.apply(this, arguments);
  }
  
  Exact.defineClass({
    constructor: Fragment,
    extend: Cache,
    mixins: [DirtyChecker.prototype],
    toString: function() {
      return Array$join.call(this, '');
    }
  });

  function StringTemplate() {
    this.push.apply(this, arguments);
  }
  
  Exact.defineClass({
    constructor: StringTemplate, extend: Array,
    statics: {
      compile: function(template, property, target, scope) {
        var i, n, expression, fragment = new Fragment(), pieces = template;
        
        for (i = 0, n = pieces.length; i < n; i += 2) {
          fragment[i] = pieces[i];

          expression = pieces[i+1];

          if (expression) {
            ExpressionUtil.applyExpression(expression, scope, fragment, i+1);
          }
        }
        
        if (i === n) {
          fragment[n-1] = pieces[n-1];
        }

        fragment.length = n;

        function exec() {
          if (!fragment.hasDirty()) { return; }

          if (target.set) {
            target.set(property, fragment.toString());
          } else {
            target[property] = fragment.toString();
          }
        }

        exec();

        if (template.mode > 0) {
          scope.on('refreshed', exec);
        }

        fragment.onChange = scope.invalidate;
 
      }
    }
  });

  Exact.StringTemplate = StringTemplate;

})();
