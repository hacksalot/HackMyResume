/**
Definition of the BaseGenerator class.
@module base-generator.js
@license MIT. See LICENSE.md for details.
*/

(function() {

  // Use J. Resig's nifty class implementation
  var Class = require( '../utils/class' );

  /**
  The BaseGenerator class is the root of the generator hierarchy. Functionality
  common to ALL generators lives here.
  */

  var BaseGenerator = module.exports = Class.extend({

    /**
    Base-class initialize.
    */
    init: function( outputFormat ) {
      this.format = outputFormat;
    },

    /**
    Status codes.
    */
    codes: require('../core/status-codes'),

    /**
    Generator options.
    */
    opts: {

    }

  });
}());
