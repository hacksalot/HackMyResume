/**
Template helper definitions for Handlebars.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module handlebars-helpers.js
*/


(function() {

  var HANDLEBARS = require('handlebars')
  , MD = require('marked')
  , H2W = require('../utils/html-to-wpml')
  , moment = require('moment')
  , _ = require('underscore');

  /**
  Register useful Handlebars helpers.
  @method registerHelpers
  */
  module.exports = function() {

    // Set up a date formatting helper so we can do:
    // {{formatDate val 'YYYY-MM'}}
    HANDLEBARS.registerHelper("formatDate", function(datetime, format) {
      return moment ? moment( datetime ).format( format ) : datetime;
    });

    // Set up a Markdown-to-WordProcessingML helper so we can do:
    // {{wmpl val [true|false]}}
    HANDLEBARS.registerHelper("wpml", function( txt, inline ) {
      if(!txt) return '';
      inline = (inline && !inline.hash) || false;
      txt = inline ?
        MD(txt.trim()).replace(/^\s*<p>|<\/p>\s*$/gi, '') :
        MD(txt.trim());
      txt = H2W( txt.trim() );
      return txt;
    });

    // Set up a last-word helper so we can do:
    // {{lastWord val [true|false]}}
    HANDLEBARS.registerHelper("lastWord", function( txt ) {
      return txt && txt.trim() ? _.last( txt.split(' ') ) : '';
    });

    // Set up a Markdown-to-WordProcessingML helper so we can do:
    // {{initialWords val [true|false]}}
    HANDLEBARS.registerHelper("initialWords", function( txt ) {
      return txt && txt.trim() ? _.initial( txt.split(' ') ).join(' ') : '';
    });

    // Set up a URL-trimming helper to drop the protocol so we can do:
    // {{trimURL url}}
    HANDLEBARS.registerHelper("trimURL", function( url ) {
      return url && url.trim() ? url.trim().replace(/^https?:\/\//i, '') : '';
    });

    // Set up a Markdown-to-WordProcessingML helper so we can do:
    // {{either A B}}
    HANDLEBARS.registerHelper("either", function( lhs, rhs, options ) {
      if (lhs || rhs) return options.fn(this);
    });

    // Set up a generic conditional helper so we can do:
    // {{compare val otherVal operator="<"}}
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

  };

}());
