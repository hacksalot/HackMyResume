/**
Generic template helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module helpers/generic-helpers
*/


(function() {

  var MD = require('marked')
    , H2W = require('../utils/html-to-wpml')
    , XML = require('xml-escape')
    , FluentDate = require('../core/fluent-date')
    , HMSTATUS = require('../core/status-codes')
    , moment = require('moment')
    , FS = require('fs')
    , LO = require('lodash')
    , PATH = require('path')
    , printf = require('printf')
    , _ = require('underscore')
    , unused = require('../utils/string');

  /** Generic template helper function definitions. */
  var GenericHelpers = module.exports = {

    /**
    Convert the input date to a specified format through Moment.js.
    If date is invalid, will return the time provided by the user,
    or default to the fallback param or 'Present' if that is set to true
    @method formatDate
    */
    formatDate: function(datetime, format, fallback) {
      if (moment) {
        var momentDate = moment( datetime );
        if (momentDate.isValid()) return momentDate.format(format);
      }

      return datetime || (typeof fallback == 'string' ? fallback : (fallback === true ? 'Present' : null));
    },

    /**
    Given a resume sub-object with a start/end date, format a representation of
    the date range.
    @method dateRange
    */
    dateRange: function( obj, fmt, sep, fallback, options ) {
      if( !obj ) return '';
      return _fromTo( obj.start, obj.end, fmt, sep, fallback, options );
    },

    /**
    Format a from/to date range for display.
    @method toFrom
    */
    fromTo: function() {
      return _fromTo.apply( this, arguments );
    },

    /**
    Return true if the section is present on the resume and has at least one
    element.
    @method section
    */
    section: function( title, options ) {
      title = title.trim().toLowerCase();
      var obj = LO.get( this.r, title );
      if( _.isArray( obj ) ) {
        return obj.length ? options.fn(this) : undefined;
      }
      else if( _.isObject( obj )) {
        return ( (obj.history && obj.history.length) ||
            ( obj.sets && obj.sets.length ) ) ?
            options.fn(this) : undefined;
      }
    },

    /**
    Emit the font face (such as 'Helvetica' or 'Calibri') associated with the
    provided key.
    @param key {String} A named style from the "fonts" section of the theme's
    theme.json file. For example: 'default' or 'heading1'.
    @param defFont {String} The font to use if the specified key isn't present.
    Can be any valid font-face name such as 'Helvetica Neue' or 'Calibri'.
    */
    fontFace: function( key, defFont ) {

      var ret = ''
        , hasDef = defFont && String.is( defFont );

      // Key must be specified
      if( !( key && key.trim()) ) {
        _reportError( HMSTATUS.invalidHelperUse, {
          helper: 'fontFace', error: HMSTATUS.missingParam, expected: 'key'
        });
        return ret;
      }

      // If the theme has a "fonts" section, lookup the font face.
      else if( GenericHelpers.theme.fonts ) {
        var fontSpec = LO.get( GenericHelpers.theme.fonts, this.format + '.' + key );
        if( !fontSpec ) {
          // Check for an "all" format
          if( GenericHelpers.theme.fonts.all )
            fontSpec = GenericHelpers.theme.fonts.all[ key ];
        }
        if( fontSpec ) {
          ret = String.is( fontSpec ) ? fontSpec : // [1]
            (_.isArray( fontSpec ) && fontSpec[0]);
        }
      }

      // We weren't able to lookup the specified key. Default to defFont.
      if( !(ret && ret.trim()) ) {
        ret = defFont;
        if( !defFont ) {
          _reportError( HMSTATUS.invalidHelperUse, {
            helper: 'fontFace', error: HMSTATUS.missingParam,
            expected: 'defFont'});
        }
      }

      return ret;
    },

    /**
    Emit a comma-delimited list of font names suitable associated with the
    provided key.
    @param key {String} A named style from the "fonts" section of the theme's
    theme.json file. For example: 'default' or 'heading1'.
    @param defFontList {Array} The font list to use if the specified key isn't
    present. Can be an array of valid font-face name such as 'Helvetica Neue'
    or 'Calibri'.
    @param sep {String} The default separator to use in the rendered output.
    Defaults to ", " (comma with a space).
    */
    fontList: function( key, defFontList, sep ) {

      var ret = ''
        , hasDef = defFontList && String.is( defFontList );

      // Key must be specified
      if( !( key && key.trim()) ) {
        _reportError( HMSTATUS.invalidHelperUse, {
          helper: 'fontList', error: HMSTATUS.missingParam, expected: 'key'
        });
      }

      // If the theme has a "fonts" section, lookup the font list.
      else if( GenericHelpers.theme.fonts ) {
        var fontSpec = LO.get( GenericHelpers.theme.fonts, this.format + '.' + key );
        if( !fontSpec ) {
          if( GenericHelpers.theme.fonts.all )
            fontSpec = GenericHelpers.theme.fonts.all[ key ];
        }

        if( fontSpec ) {
          if( _.isArray( fontSpec ) ) {
            fontSpec = fontSpec.map( function(ff) {
              return "'" + ff + "'";
            });
            ret = fontSpec.join( sep === undefined ? ', ' : (sep || '') );
          }
          else if( _.isString( fontSpec )) { ret = fontSpec; }
        }
      }

      // The key wasn't found in the "fonts" section. Default to defFont.
      if( !(ret && ret.trim()) ) {
        ret = defFontList;
        if( !hasDef )
          _reportError( HMSTATUS.invalidHelperUse, {
            helper: 'fontList', error: HMSTATUS.missingParam,
            expected: 'defFontList'});
      }

      return ret;
    },

    /**
    Capitalize the first letter of the word.
    @method section
    */
    camelCase: function(val) {
      val = (val && val.trim()) || '';
      return val ? (val.charAt(0).toUpperCase() + val.slice(1)) : val;
    },

    /**
    Return true if the context has the property or subpropery.
    @method has
    */
    has: function( title, options ) {
      title = title && title.trim().toLowerCase();
      if( LO.get( this.r, title ) ) {
        return options.fn(this);
      }
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
    Convert text to lowercase.
    @method toLower
    */
    toUpper: function( txt ) {
      return txt && txt.trim() ? txt.toUpperCase() : '';
    },

    /**
    Return true if either value is truthy.
    @method either
    */
    either: function( lhs, rhs, options ) {
      if (lhs || rhs) return options.fn(this);
    },

    /**
    Conditional stylesheet link. Creates a link to the specified stylesheet with
    <link> or embeds the styles inline with <style></style>, depending on the
    theme author's and user's preferences.
    @param url {String} The path to the CSS file.
    @param linkage {String} The default link method. Can be either `embed` or
    `link`. If omitted, defaults to `embed`. Can be overridden by the `--css`
    command-line switch.
    */

    styleSheet: function( url, linkage ) {

      // Establish the linkage style
      linkage = this.opts.css || linkage || 'embed';

      // Create the <link> or <style> tag
      var ret = '';
      if( linkage === 'link' ) {
        ret = printf('<link href="%s" rel="stylesheet" type="text/css">', url);
      }
      else {
        var rawCss = FS.readFileSync(
          PATH.join( this.opts.themeObj.folder, '/src/', url ), 'utf8' );
        var renderedCss = this.engine.generateSimple( this, rawCss );
        ret = printf('<style>%s</style>', renderedCss );
      }

      // If the currently-executing template is inherited, append styles
      if( this.opts.themeObj.inherits &&
          this.opts.themeObj.inherits.html &&
          this.format === 'html' ) {
        ret += (linkage === 'link') ?
          '<link href="' + this.opts.themeObj.overrides.path +
          '" rel="stylesheet" type="text/css">' :
          '<style>' + this.opts.themeObj.overrides.data + '</style>';
      }

      // TODO: It would be nice to use Handlebar.SafeString here, but these
      // are supposed to be generic helpers. Provide an equivalent, or expose
      // it when Handlebars is the chosen engine, which is most of the time.
      return ret;
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


  /**
  Report an error to the outside world without throwing an exception. Currently
  relies on kludging the running verb into. opts.
  */
  function _reportError( code, params ) {
    GenericHelpers.opts.errHandler.err( code, params );
  }

  /**
  Format a from/to date range for display.
  */
  function _fromTo( dateA, dateB, fmt, sep, fallback ) {

    // Prevent accidental use of safe.start, safe.end, safe.date
    // The dateRange helper is for raw dates only
    if( moment.isMoment( dateA ) || moment.isMoment( dateB ) ) {
      _reportError( HMSTATUS.invalidHelperUse, { helper: 'dateRange' } );
      return '';
    }

    var dateFrom, dateTo, dateTemp;

    // Check for 'current', 'present', 'now', '', null, and undefined
    dateA = dateA || '';
    dateB = dateB || '';
    var dateATrim = dateA.trim().toLowerCase();
    var dateBTrim = dateB.trim().toLowerCase();
    var reserved = ['current','present','now', ''];

    fmt = (fmt && String.is(fmt) && fmt) || 'YYYY-MM';
    sep = (sep && String.is(sep) && sep) || ' — ';

    if( _.contains( reserved, dateATrim )) {
      dateFrom = fallback || '???';
    }
    else {
      dateTemp = FluentDate.fmt( dateA );
      dateFrom = dateTemp.format( fmt );
    }

    if( _.contains( reserved, dateBTrim )) {
      dateTo = fallback || 'Current';
    }
    else {
      dateTemp = FluentDate.fmt( dateB );
      dateTo = dateTemp.format( fmt );
    }

    if( dateFrom && dateTo ) {
      return dateFrom + sep + dateTo;
    }
    else if( dateFrom || dateTo ) {
      return dateFrom || dateTo;
    }

    return '';
  }

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

// Note [1] --------------------------------------------------------------------
// Make sure it's precisely a string or array since some template engines jam
// their options/context object into the last parameter and we are allowing the
// defFont parameter to be omitted in certain cases. This is a little kludgy,
// but works fine for this case. If we start doing this regularly, we should
// rebind these parameters.

// Note [2]: -------------------------------------------------------------------
// If execution reaches here, some sort of cosmic ray or sunspot has landed on
// HackMyResume, or a theme author is deliberately messing with us by doing
// something like:
//
// "fonts": {
//   "default": "",
//   "heading1": null
// }
//
// Rather than sort it out, we'll just fall back to defFont.
