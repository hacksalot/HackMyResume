/**
Handlebars template generate for FluentCV.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
*/

(function() {

  var _ = require('underscore');
  var HANDLEBARS = require('handlebars');
  var FS = require('fs');
  var moment = require('moment');

  module.exports = function( json, jst, format, cssInfo, opts, theme ) {

    _.each( theme.partials, function( el ) {
      var tplData = FS.readFileSync( el.path, 'utf8' );
      var compiledTemplate = HANDLEBARS.compile( tplData );
      HANDLEBARS.registerPartial( el.name, compiledTemplate );
    });

    HANDLEBARS.registerHelper("formatDate", function(datetime, format) {
      if( moment ) {
        return moment( datetime ).format( format );
      }
      else {
        return datetime;
      }
    });

    // http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/
    HANDLEBARS.registerHelper('compare', function(lvalue, rvalue, options) {

      if (arguments.length < 3)
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

      var operator = options.hash.operator || "==";
      var operators = {
          '==':       function(l,r) { return l == r; },
          '===':      function(l,r) { return l === r; },
          '!=':       function(l,r) { return l != r; },
          '<':        function(l,r) { return l < r; },
          '>':        function(l,r) { return l > r; },
          '<=':       function(l,r) { return l <= r; },
          '>=':       function(l,r) { return l >= r; },
          'typeof':   function(l,r) { return typeof l == r; }
      };

      if (!operators[operator])
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+operator);
      var result = operators[operator](lvalue,rvalue);
      return result ? options.fn(this) : options.inverse(this);
    });

    var template = HANDLEBARS.compile(jst);
    return template({
      r: json,
      filt: opts.filters,
      cssInfo: cssInfo,
      headFragment: opts.headFragment || ''
    });

  };

}());
