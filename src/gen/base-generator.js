/**
Base resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {
  var Class = require( './class' );
  var BaseGenerator = module.exports = Class.extend({
    init: function( outputFormat ) {
      this.format = outputFormat;
    }
  });
}());
