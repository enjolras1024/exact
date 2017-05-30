//######################################################################################################################
// src/core/template/parsers/TextBindingParser.js
//######################################################################################################################
(function() {

  var StringUtil = Exact.StringUtil;
  var Expression = Exact.Expression;
  var TextBinding = Exact.TextBinding;
  var DataBindingParser = Exact.DataBindingParser;
  var BINDING_OPERATORS = Exact.BINDING_OPERATORS;
  
  var DATA_BINDING_BRACKETS = Exact.DATA_BINDING_BRACKETS;//'{}';//

  var BINDING_LIKE_REGEXP = new RegExp(
    '['+ BINDING_OPERATORS.ONE_TIME + BINDING_OPERATORS.ONE_WAY + BINDING_OPERATORS.TWO_WAY +']\\'
    + DATA_BINDING_BRACKETS[0]// + '.+\\' + DATA_BINDING_BRACKETS[1]
  );

  Exact.TextBindingParser = {
    like: function like(expr) {
      return BINDING_LIKE_REGEXP.test(expr);
    },
    /**
     * @param {string} expr
     * @param {Object} resources
     * @param {Array} parameters
     * @returns {*}
     */
    parse: function(expr, resources, parameters) { //TODO:
      var i, j, indices = [0], template = [], piece;

      var range0 = StringUtil.range(expr, -1, BINDING_OPERATORS.ONE_TIME, DATA_BINDING_BRACKETS);
      var range1 = StringUtil.range(expr, -1, BINDING_OPERATORS.ONE_WAY, DATA_BINDING_BRACKETS);

      //if (!range0 && !range1) { return null; } // maybe attrs: {'style?': 'red'}

      while (range1 || range0) {
        if (range1) {
          if (range0 && range0[0] < range1[0]) {
            i = range0[0];
            j = range0[1];
            range0 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_TIME, DATA_BINDING_BRACKETS);
          } else {
            i = range1[0];
            j = range1[1];
            range1 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_WAY, DATA_BINDING_BRACKETS);
          }
        } else {
          if (range1 && range1[0] < range0[0]) {
            i = range1[0];
            j = range1[1];
            range1 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_WAY, DATA_BINDING_BRACKETS);
          } else {
            i = range0[0];
            j = range0[1];
            range0 = StringUtil.range(expr, j, BINDING_OPERATORS.ONE_TIME, DATA_BINDING_BRACKETS);
          }
        }

        indices.push(i, j);
      }

      indices.push(expr.length);

      for (i = 0, j = indices.length - 1; i < j; ++i) {
        piece = expr.slice(indices[i], indices[i+1]);

        if (i % 2) {
          template[i] = DataBindingParser.parse(piece[0], piece.slice(2, piece.length - 1), resources, parameters);
        } else {
          template[i] = piece;
        }
      }

      return Expression.create(TextBinding, template);
    }
  };

})();
