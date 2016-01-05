/**
Generic template helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module generic-helpers.js
*/


(function() {

  var MD = require('marked')
    , H2W = require('../utils/html-to-wpml')
    , XML = require('xml-escape')
    , moment = require('moment')
    , _ = require('underscore')
    , unused = require('../utils/string');

  /**
  Generic template helper function definitions.
  @class GenericHelpers
  */
  var GenericHelpers = module.exports = {

    /**
    Convert the input date to a specified format through Moment.js.
    @method formatDate
    */
    formatDate: function(datetime, format) {
      return moment ? moment( datetime ).format( format ) : datetime;
    },

    /**
    Generic template helper function to display a user-overridable section
    title for a FRESH resume theme. Use this in lieue of hard-coding section
    titles.

    Usage:

        {{sectionTitle "sectionName"}}
        {{sectionTitle "sectionName" "sectionTitle"}}

    Example:

        {{sectionTitle "Education"}}
        {{sectionTitle "Employment" "Project History"}}

    @param sect_name The name of the section being title. Must be one of the
    top-level FRESH resume sections ("info", "education", "employment", etc.).
    @param sect_title The theme-specified section title. May be replaced by the
    user.
    @method sectionTitle
    */
    sectionTitle: function( sname, stitle ) {

      // If not provided by the user, stitle should default to sname. ps.
      // Handlebars silently passes in the options object to the last param,
      // where in Underscore stitle will be null/undefined, so we check both.
      stitle = (stitle && String.is(stitle) && stitle) || sname;

      // If there's a section title override, use it.
      return ( this.opts.stitles &&
               this.opts.stitles[ sname.toLowerCase().trim() ] ) ||
               stitle;
    },

    /**
    Convert inline Markdown to inline WordProcessingML.
    @method wpml
    */
    wpml: function( txt, inline ) {
      if(!txt) return '';
      inline = (inline && !inline.hash) || false;
      txt = XML(txt.trim());
      txt = inline ?
        MD(txt).replace(/^\s*<p>|<\/p>\s*$/gi, '') :
        MD(txt);
      txt = H2W( txt );
      return txt;
    },

    /**
    Emit a conditional link.
    @method link
    */
    link: function( text, url ) {
      return url && url.trim() ?
        ('<a href="' + url + '">' + text + '</a>') : text;
    },

    /**
    Return the last word of the specified text.
    @method lastWord
    */
    lastWord: function( txt ) {
      return txt && txt.trim() ? _.last( txt.split(' ') ) : '';
    },

    /**
    Convert a skill level to an RGB color triplet. TODO: refactor
    @method skillColor
    @param lvl Input skill level. Skill level can be expressed as a string
    ("beginner", "intermediate", etc.), as an integer (1,5,etc), as a string
    integer ("1", "5", etc.), or as an RRGGBB color triplet ('#C00000',
    '#FFFFAA').
    */
    skillColor: function( lvl ) {
      var idx = skillLevelToIndex( lvl );
      var skillColors = (this.theme && this.theme.palette &&
        this.theme.palette.skillLevels) ||
        [ '#FFFFFF', '#5CB85C', '#F1C40F', '#428BCA', '#C00000' ];
      return skillColors[idx];
    },

    /**
    Return an appropriate height. TODO: refactor
    @method lastWord
    */
    skillHeight: function( lvl ) {
      var idx = skillLevelToIndex( lvl );
      return ['38.25', '30', '16', '8', '0'][idx];
    },

    /**
    Return all but the last word of the input text.
    @method initialWords
    */
    initialWords: function( txt ) {
      return txt && txt.trim() ? _.initial( txt.split(' ') ).join(' ') : '';
    },

    /**
    Trim the protocol (http or https) from a URL/
    @method trimURL
    */
    trimURL: function( url ) {
      return url && url.trim() ? url.trim().replace(/^https?:\/\//i, '') : '';
    },

    /**
    Convert text to lowercase.
    @method toLower
    */
    toLower: function( txt ) {
      return txt && txt.trim() ? txt.toLowerCase() : '';
    },

    /**
    Return true if either value is truthy.
    @method either
    */
    either: function( lhs, rhs, options ) {
      if (lhs || rhs) return options.fn(this);
    },

    /**
    Conditional stylesheet link. Either display the link or embed the stylesheet
    via <style></style> tag.
    */
    styleSheet: function( file, options ) {
      return ( this.opts.css === 'link') ?
        '<link href="' + file + '" rel="stylesheet" type="text/css">' :
        '<style>' + this.cssInfo.data + '</style>';
    },

    /**
    Perform a generic comparison.
    See: http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates
    @method compare
    */
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
      idx = Math.max( 0, idx );
    }
    return idx;
  }

}());
