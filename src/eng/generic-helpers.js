/**
Generic template helper definitions for FluentCV.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module generic-helpers.js
*/


(function() {

  var MD = require('marked')
    , H2W = require('../utils/html-to-wpml')
    , moment = require('moment')
    , _ = require('underscore');

  /**
  Register useful Handlebars helpers.
  @method registerHelpers
  */
  module.exports = {

    // Set up a date formatting helper so we can do:
    // {{formatDate val 'YYYY-MM'}}
    formatDate: function(datetime, format) {
      return moment ? moment( datetime ).format( format ) : datetime;
    },

    // Set up a Markdown-to-WordProcessingML helper so we can do:
    // {{wmpl val [true|false]}}
    wpml: function( txt, inline ) {
      if(!txt) return '';
      inline = (inline && !inline.hash) || false;
      txt = inline ?
        MD(txt.trim()).replace(/^\s*<p>|<\/p>\s*$/gi, '') :
        MD(txt.trim());
      txt = H2W( txt.trim() );
      return txt;
    },

    // Set up a last-word helper so we can do:
    // {{lastWord val [true|false]}}
    link: function( text, url ) {
      return url && url.trim() ?
        ('<a href="' + url + '">' + text + '</a>') : text;
    },

    // Set up a last-word helper so we can do:
    // {{lastWord val [true|false]}}
    lastWord: function( txt ) {
      return txt && txt.trim() ? _.last( txt.split(' ') ) : '';
    },

    // Set up a skill colorizing helper:
    // {{skillColor val}}
    // Skill level can be expressed as a string ("beginner", "intermediate",
    // etc.), as an integer (1,5,etc), as a string integer ("1", "5", etc.),
    // or as an RRGGBB color triplet ('#C00000', '#FFFFAA').
    skillColor: function( lvl ) {
      var idx = skillLevelToIndex( lvl );
      var skillColors = (this.theme && this.theme.palette &&
        this.theme.palette.skillLevels) ||
        [ '#FFFFFF', '#5CB85C', '#F1C40F', '#428BCA', '#C00000' ];
      return skillColors[idx];
    },

    // Set up a skill colorizing helper:
    // {{skillColor val}}
    skillHeight: function( lvl ) {
      var idx = skillLevelToIndex( lvl );
      return ['38.25', '30', '16', '8', '0'][idx];
    },

    // Set up a Markdown-to-WordProcessingML helper so we can do:
    // {{initialWords val [true|false]}}
    initialWords: function( txt ) {
      return txt && txt.trim() ? _.initial( txt.split(' ') ).join(' ') : '';
    },

    // Set up a URL-trimming helper to drop the protocol so we can do:
    // {{trimURL url}}
    trimURL: function( url ) {
      return url && url.trim() ? url.trim().replace(/^https?:\/\//i, '') : '';
    },

    // Set up a URL-trimming helper to drop the protocol so we can do:
    // {{trimURL url}}
    toLower: function( txt ) {
      return txt && txt.trim() ? txt.toLowerCase() : '';
    },

    // Set up a Markdown-to-WordProcessingML helper so we can do:
    // {{either A B}}
    either: function( lhs, rhs, options ) {
      if (lhs || rhs) return options.fn(this);
    },

    // Set up a generic conditional helper so we can do:
    // {{compare val otherVal operator="<"}}
    // http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/
    compare: function(lvalue, rvalue, options) {
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
    }

  };

  function skillLevelToIndex( lvl ) {
    var idx = 0;
    if( String.is( lvl ) ) {
      lvl = lvl.trim().toLowerCase();
      var intVal = parseInt( lvl );
      if( isNaN( intVal ) ) {
        switch( lvl ) {
          case 'beginner': idx = 1; break;
          case 'intermediate': idx = 2; break;
          case 'advanced': idx = 3; break;
          case 'master': idx = 4; break;
        }
      }
      else {
        idx = Math.min( intVal / 2, 4 );
        idx = Math.max( 0, idx );
      }
    }
    else {
      idx = Math.min( lvl / 2, 4 );
      idx = Math.max( 0, intVal );
    }
    return idx;
  }

}());
