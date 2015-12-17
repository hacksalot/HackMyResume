/**
Definition of the HandlebarsGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module handlebars-generator.js
*/

(function() {



  var _ = require('underscore')
    , HANDLEBARS = require('handlebars')
    , FS = require('fs')
    , moment = require('moment')
    , MD = require('marked')
    , H2W = require('../utils/html-to-wpml');



  /**
  Perform template-based resume generation using Handlebars.js.
  @method generate
  */
  module.exports = function( json, jst, format, cssInfo, opts, theme ) {

    // Pre-compile any partials present in the theme.
    _.each( theme.partials, function( el ) {
      var tplData = FS.readFileSync( el.path, 'utf8' );
      var compiledTemplate = HANDLEBARS.compile( tplData );
      HANDLEBARS.registerPartial( el.name, compiledTemplate );
    });

    // Register necessary helpers.
    registerHelpers();

    // Compile and run the Handlebars template.
    var template = HANDLEBARS.compile(jst);
    return template({
      r: json,
      filt: opts.filters,
      cssInfo: cssInfo,
      headFragment: opts.headFragment || ''
    });

  };



  /**
  Register useful Handlebars helpers.
  @method registerHelpers
  */
  function registerHelpers() {

    // Set up a date formatting helper so we can do:
    // {{#formatDate val 'YYYY-MM'}}
    HANDLEBARS.registerHelper("formatDate", function(datetime, format) {
      if( moment ) {
        return moment( datetime ).format( format );
      }
      else {
        return datetime;
      }
    });

    // Set up a Markdown-to-WordProcessingML helper so we can do:
    // {{#wmpl val [true|false]}}
    HANDLEBARS.registerHelper("wpml", function( txt, inline ) {
      inline = (inline && !inline.hash) || false;
      txt = inline ?
        MD(txt.trim()).replace(/^\s*<p>|<\/p>\s*$/gi, '') :
        MD(txt.trim());
      txt = H2W( txt.trim() );
      return txt;
    });

    // Set up a generic conditional helper so we can do:
    // {{#compare val otherVal operator="<"}}
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
  }



}());
