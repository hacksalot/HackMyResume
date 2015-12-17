/**
Definition of the BaseGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module base-generator.js
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
    codes: {
      success: 0,
      themeNotFound: 1,
      copyCss: 2,
      resumeNotFound: 3,
      missingCommand: 4,
      invalidCommand: 5
    },

    /**
    Generator options.
    */
    opts: {

    }

  });
}());
