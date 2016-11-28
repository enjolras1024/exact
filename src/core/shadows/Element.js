//######################################################################################################################
// src/core/shadows/Element.js
//######################################################################################################################
(function () {
  'use strict';

  var Shadow = Exact.Shadow;
  var Watcher = Exact.Watcher;


  function Element(props, tag, ns) {
    Element.initialize(this, props, tag, ns);
  }

  Exact.defineClass({
    constructor: Element,

    extend: Shadow,

    mixins: [Watcher.prototype],

    statics: {
      fullName: 'Element',
      /**
       * Destroy the element. Remove event listeners, and //TODO:
       *
       * @param {Element} element
       */
      release: function release(element) {
        element.off();
        Shadow.clean(element);
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
        if (ns && typeof ns === 'object') { // create(tag, props)
          props = ns;
        } // else create(tag) or create(tag, ns) or create(tag, ns, props)

        return new Element(props, tag, ns);
      }
    }
  });

  Exact.Element = Element;

})();
