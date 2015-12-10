/**
Handlebars template generate for FluentCV.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
*/

(function() {

  var _ = require('underscore');
  var HANDLEBARS = require('handlebars');

  module.exports = function( json, jst, format, cssInfo, opts ) {

    var template = HANDLEBARS.compile(jst);
    return template( { r: json, filt: opts.filters, cssInfo: cssInfo, headFragment: opts.headFragment || '' } );

  };

}());
