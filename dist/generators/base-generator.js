
/**
Definition of the BaseGenerator class.
@module base-generator.js
@license MIT. See LICENSE.md for details.
 */

(function() {
  var BaseGenerator, Class;

  Class = require('../utils/class');


  /**
  The BaseGenerator class is the root of the generator hierarchy. Functionality
  common to ALL generators lives here.
   */

  BaseGenerator = module.exports = Class.extend({

    /** Base-class initialize. */
    init: function(outputFormat) {
      return this.format = outputFormat;
    },

    /** Status codes. */
    codes: require('../core/status-codes'),

    /** Generator options. */
    opts: {}
  });

}).call(this);
