//######################################################################################################################
// src/core/shadows/Element.js
//######################################################################################################################
(function () {

  var Shadow = Exact.Shadow;
  var Watcher = Exact.Watcher;

  function Element(props, tag, ns) {
    Element.initialize(this, props, tag, ns);
  }

  Exact.defineClass({
    constructor: Element, extend: Shadow,

    mixins: [Watcher.prototype],

    statics: {
      initialize: function initialize(element, props, tag, ns) {
        if ('__DEV__' === 'development') {
          if (element.constructor !== Element) {
            throw new TypeError('Element is final class and can not be extended');
          }
        }

        Shadow.initialize(element, tag, ns || '');

        element.save(props);
      },

      /**
       * Create a element shadow
       *
       * @param {string} tag
       * @param {string} ns
       * @param {Object} props
       * @returns {Element}
       */
      create: function create(tag, ns, props) {
        //if (ns && typeof ns === 'object') { // create(tag, props)
        //  props = ns;
        //} // else create(tag) or create(tag, ns) or create(tag, ns, props)

        return new Element(props, tag, ns);
      }
    }
  });

  Exact.Element = Element;

})();
