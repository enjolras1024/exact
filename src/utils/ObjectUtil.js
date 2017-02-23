//######################################################################################################################
// src/utils/ObjectUtil.js
//######################################################################################################################
(function() {

  var features = {};

  features.seal = 'seal' in Object;
  features.freeze = 'freeze' in Object;
  features.assign = 'assign' in Object;

  try {
    Object.defineProperty({}, 'x', {get: function() {}, set: function() {}});
    features.accessor = true;
  } catch (error) {
    features.accessor = false;
  }
  //features.accessor = false;

  Exact.ObjectUtil = {
    support: function support(name) {
      return features[name];
    }
  };

})();
