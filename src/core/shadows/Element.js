//######################################################################################################################
// src/core/shadows/Element.js
//######################################################################################################################
(function () {
  'use strict';

  var Shadow = Exact.Shadow;
  var Watcher = Exact.Watcher;


  function Element(tag, props) {
    Element.initialize(this, tag, props);
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
       * @param {Object} props
       * @returns {Element}
       */
      create: function create(tag, props) {

        return new Element(tag, props);
      }
    }
  });

  Exact.Element = Element;

})();
