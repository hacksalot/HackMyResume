/**
Base resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {
  var Class = require( '../utils/class' );

  /**
  The BaseGenerator class is the root of the generator hierarchy. Functionality
  common to ALL generators lives here.
  */
  var BaseGenerator = module.exports = Class.extend({
    init: function( outputFormat ) {
      this.format = outputFormat;
    }
  });
}());
