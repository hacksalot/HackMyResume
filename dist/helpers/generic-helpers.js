
/**
Generic template helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module helpers/generic-helpers
 */

(function() {
  var FS, FluentDate, GenericHelpers, H2W, HMSTATUS, LO, MD, PATH, XML, _, _fromTo, _reportError, moment, printf, skillLevelToIndex, unused;

  MD = require('marked');

  H2W = require('../utils/html-to-wpml');

  XML = require('xml-escape');

  FluentDate = require('../core/fluent-date');

  HMSTATUS = require('../core/status-codes');

  moment = require('moment');

  FS = require('fs');

  LO = require('lodash');

  PATH = require('path');

  printf = require('printf');

  _ = require('underscore');

  unused = require('../utils/string');


  /** Generic template helper function definitions. */

  GenericHelpers = module.exports = {

    /**
    Emit a formatted string representing the specified datetime.
    Convert the input date to the specified format through Moment.js. If date is
    valid, return the formatted date string. If date is null, undefined, or other
    falsy value, return the value of the 'fallback' parameter, if specified, or
    null if no fallback was specified. If date is invalid, but not null/undefined/
    falsy, return it as-is.
    @param {string|Moment} datetime A date value.
    @param {string} [dtFormat='YYYY-MM'] The desired datetime format. Must be a
    Moment.js-compatible datetime format.
    @param {string|Moment} fallback A fallback value to use if the specified date
    is null, undefined, or falsy.
     */
    formatDate: function(datetime, dtFormat, fallback) {
      var momentDate;
      if (datetime == null) {
        datetime = void 0;
      }
      if (dtFormat == null) {
        dtFormat = 'YYYY-MM';
      }
      if (datetime && moment.isMoment(datetime)) {
        return datetime.format(dtFormat);
      }
      if (String.is(datetime)) {
        momentDate = moment(datetime, dtFormat);
        if (momentDate.isValid()) {
          return momentDate.format(dtFormat);
        }
        momentDate = moment(datetime);
        if (momentDate.isValid()) {
          return momentDate.format(dtFormat);
        }
      }
      return datetime || (typeof fallback === 'string' ? fallback : (fallback === true ? 'Present' : ''));
    },

    /**
    Emit a formatted string representing the specified datetime.
    @param {string} dateValue A raw date value from the FRESH or JRS resume.
    @param {string} [dateFormat='YYYY-MM'] The desired datetime format. Must be
    compatible with Moment.js datetime formats.
    @param {string} [dateDefault=null] The default date value to use if the dateValue
    parameter is null, undefined, or falsy.
     */
    date: function(dateValue, dateFormat, dateDefault) {
      var dateValueMoment, dateValueSafe, reserved;
      if (!dateDefault || !String.is(dateDefault)) {
        dateDefault = 'Current';
      }
      if (!dateFormat || !String.is(dateFormat)) {
        dateFormat = 'YYYY-MM';
      }
      if (!dateValue || !String.is(dateValue)) {
        dateValue = null;
      }
      if (!dateValue) {
        return dateDefault;
      }
      reserved = ['current', 'present', 'now'];
      dateValueSafe = dateValue.trim().toLowerCase();
      if (_.contains(reserved, dateValueSafe)) {
        return dateValue;
      }
      dateValueMoment = moment(dateValue, dateFormat);
      if (dateValueMoment.isValid()) {
        return dateValueMoment.format(dateFormat);
      }
      return dateValue;
    },

    /**
    Given a resume sub-object with a start/end date, format a representation of
    the date range.
     */
    dateRange: function(obj, fmt, sep, fallback) {
      if (!obj) {
        return '';
      }
      return _fromTo(obj.start, obj.end, fmt, sep, fallback);
    },

    /**
    Format a from/to date range for display.
    @method toFrom
     */
    fromTo: function() {
      return _fromTo.apply(this, arguments);
    },

    /**
    Return a named color value as an RRGGBB string.
    @method toFrom
     */
    color: function(colorName, colorDefault) {
      var ret;
      if (!(colorName && colorName.trim())) {
        return _reportError(HMSTATUS.invalidHelperUse, {
          helper: 'fontList',
          error: HMSTATUS.missingParam,
          expected: 'name'
        });
      } else {
        if (!GenericHelpers.theme.colors) {
          return colorDefault;
        }
        ret = GenericHelpers.theme.colors[colorName];
        if (!(ret && ret.trim())) {
          return colorDefault;
        }
        return ret;
      }
    },

    /**
    Emit the size of the specified named font.
    @param key {String} A named style from the "fonts" section of the theme's
    theme.json file. For example: 'default' or 'heading1'.
     */
    fontSize: function(key, defSize, units) {
      var fontSpec, hasDef, ret;
      ret = '';
      hasDef = defSize && (String.is(defSize) || _.isNumber(defSize));
      if (!(key && key.trim())) {
        _reportError(HMSTATUS.invalidHelperUse, {
          helper: 'fontSize',
          error: HMSTATUS.missingParam,
          expected: 'key'
        });
        return ret;
      } else if (GenericHelpers.theme.fonts) {
        fontSpec = LO.get(GenericHelpers.theme.fonts, this.format + '.' + key);
        if (!fontSpec) {
          if (GenericHelpers.theme.fonts.all) {
            fontSpec = GenericHelpers.theme.fonts.all[key];
          }
        }
        if (fontSpec) {
          if (String.is(fontSpec)) {

          } else if (_.isArray(fontSpec)) {
            if (!String.is(fontSpec[0])) {
              ret = fontSpec[0].size;
            }
          } else {
            ret = fontSpec.size;
          }
        }
      }
      if (!ret) {
        if (hasDef) {
          ret = defSize;
        } else {
          _reportError(HMSTATUS.invalidHelperUse, {
            helper: 'fontSize',
            error: HMSTATUS.missingParam,
            expected: 'defSize'
          });
          ret = '';
        }
      }
      return ret;
    },

    /**
    Emit the font face (such as 'Helvetica' or 'Calibri') associated with the
    provided key.
    @param key {String} A named style from the "fonts" section of the theme's
    theme.json file. For example: 'default' or 'heading1'.
    @param defFont {String} The font to use if the specified key isn't present.
    Can be any valid font-face name such as 'Helvetica Neue' or 'Calibri'.
     */
    fontFace: function(key, defFont) {
      var fontSpec, hasDef, ret;
      ret = '';
      hasDef = defFont && String.is(defFont);
      if (!(key && key.trim())) {
        _reportError(HMSTATUS.invalidHelperUse, {
          helper: 'fontFace',
          error: HMSTATUS.missingParam,
          expected: 'key'
        });
        return ret;
      } else if (GenericHelpers.theme.fonts) {
        fontSpec = LO.get(GenericHelpers.theme.fonts, this.format + '.' + key);
        if (!fontSpec) {
          if (GenericHelpers.theme.fonts.all) {
            fontSpec = GenericHelpers.theme.fonts.all[key];
          }
        }
        if (fontSpec) {
          if (String.is(fontSpec)) {
            ret = fontSpec;
          } else if (_.isArray(fontSpec)) {
            ret = String.is(fontSpec[0]) ? fontSpec[0] : fontSpec[0].name;
          } else {
            ret = fontSpec.name;
          }
        }
      }
      if (!(ret && ret.trim())) {
        ret = defFont;
        if (!hasDef) {
          _reportError(HMSTATUS.invalidHelperUse, {
            helper: 'fontFace',
            error: HMSTATUS.missingParam,
            expected: 'defFont'
          });
          ret = '';
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
    fontList: function(key, defFontList, sep) {
      var fontSpec, hasDef, ret;
      ret = '';
      hasDef = defFontList && String.is(defFontList);
      if (!(key && key.trim())) {
        _reportError(HMSTATUS.invalidHelperUse, {
          helper: 'fontList',
          error: HMSTATUS.missingParam,
          expected: 'key'
        });
      } else if (GenericHelpers.theme.fonts) {
        fontSpec = LO.get(GenericHelpers.theme.fonts, this.format + '.' + key);
        if (!fontSpec) {
          if (GenericHelpers.theme.fonts.all) {
            fontSpec = GenericHelpers.theme.fonts.all[key];
          }
        }
        if (fontSpec) {
          if (String.is(fontSpec)) {
            ret = fontSpec;
          } else if (_.isArray(fontSpec)) {
            fontSpec = fontSpec.map(function(ff) {
              return "'" + (String.is(ff) ? ff : ff.name) + "'";
            });
            ret = fontSpec.join(sep === void 0 ? ', ' : sep || '');
          } else {
            ret = fontSpec.name;
          }
        }
      }
      if (!(ret && ret.trim())) {
        if (!hasDef) {
          _reportError(HMSTATUS.invalidHelperUse, {
            helper: 'fontList',
            error: HMSTATUS.missingParam,
            expected: 'defFontList'
          });
          ret = '';
        } else {
          ret = defFontList;
        }
      }
      return ret;
    },

    /**
    Capitalize the first letter of the word. TODO: Rename
    @method section
     */
    camelCase: function(val) {
      val = (val && val.trim()) || '';
      if (val) {
        return val.charAt(0).toUpperCase() + val.slice(1);
      } else {
        return val;
      }
    },

    /**
    Display a user-overridable section title for a FRESH resume theme. Use this in
    lieue of hard-coding section titles.
    
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
    sectionTitle: function(sname, stitle) {
      stitle = (stitle && String.is(stitle) && stitle) || sname;
      return (this.opts.stitles && this.opts.stitles[sname.toLowerCase().trim()]) || stitle;
    },

    /** Convert inline Markdown to inline WordProcessingML. */
    wpml: function(txt, inline) {
      if (!txt) {
        return '';
      }
      inline = (inline && !inline.hash) || false;
      txt = XML(txt.trim());
      txt = inline ? MD(txt).replace(/^\s*<p>|<\/p>\s*$/gi, '') : MD(txt);
      txt = H2W(txt);
      return txt;
    },

    /**
    Emit a conditional link.
    @method link
     */
    link: function(text, url) {
      if (url && url.trim()) {
        return '<a href="' + url + '">' + text + '</a>';
      } else {
        return text;
      }
    },

    /**
    Return the last word of the specified text.
    @method lastWord
     */
    lastWord: function(txt) {
      if (txt && txt.trim()) {
        return _.last(txt.split(' '));
      } else {
        return '';
      }
    },

    /**
    Convert a skill level to an RGB color triplet. TODO: refactor
    @method skillColor
    @param lvl Input skill level. Skill level can be expressed as a string
    ("beginner", "intermediate", etc.), as an integer (1,5,etc), as a string
    integer ("1", "5", etc.), or as an RRGGBB color triplet ('#C00000',
    '#FFFFAA').
     */
    skillColor: function(lvl) {
      var idx, skillColors;
      idx = skillLevelToIndex(lvl);
      skillColors = (this.theme && this.theme.palette && this.theme.palette.skillLevels) || ['#FFFFFF', '#5CB85C', '#F1C40F', '#428BCA', '#C00000'];
      return skillColors[idx];
    },

    /**
    Return an appropriate height. TODO: refactor
    @method lastWord
     */
    skillHeight: function(lvl) {
      var idx;
      idx = skillLevelToIndex(lvl);
      return ['38.25', '30', '16', '8', '0'][idx];
    },

    /**
    Return all but the last word of the input text.
    @method initialWords
     */
    initialWords: function(txt) {
      if (txt && txt.trim()) {
        return _.initial(txt.split(' ')).join(' ');
      } else {
        return '';
      }
    },

    /**
    Trim the protocol (http or https) from a URL/
    @method trimURL
     */
    trimURL: function(url) {
      if (url && url.trim()) {
        return url.trim().replace(/^https?:\/\//i, '');
      } else {
        return '';
      }
    },

    /**
    Convert text to lowercase.
    @method toLower
     */
    toLower: function(txt) {
      if (txt && txt.trim()) {
        return txt.toLowerCase();
      } else {
        return '';
      }
    },

    /**
    Convert text to lowercase.
    @method toLower
     */
    toUpper: function(txt) {
      if (txt && txt.trim()) {
        return txt.toUpperCase();
      } else {
        return '';
      }
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
    styleSheet: function(url, linkage) {
      var rawCss, renderedCss, ret;
      linkage = this.opts.css || linkage || 'embed';
      ret = '';
      if (linkage === 'link') {
        ret = printf('<link href="%s" rel="stylesheet" type="text/css">', url);
      } else {
        rawCss = FS.readFileSync(PATH.join(this.opts.themeObj.folder, '/src/', url), 'utf8');
        renderedCss = this.engine.generateSimple(this, rawCss);
        ret = printf('<style>%s</style>', renderedCss);
      }
      if (this.opts.themeObj.inherits && this.opts.themeObj.inherits.html && this.format === 'html') {
        ret += linkage === 'link' ? '<link href="' + this.opts.themeObj.overrides.path + '" rel="stylesheet" type="text/css">' : '<style>' + this.opts.themeObj.overrides.data + '</style>';
      }
      return ret;
    },

    /**
    Perform a generic comparison.
    See: http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates
    @method compare
     */
    compare: function(lvalue, rvalue, options) {
      var operator, operators, result;
      if (arguments.length < 3) {
        throw new Error("Template helper 'compare' needs 2 parameters");
      }
      operator = options.hash.operator || "==";
      operators = {
        '==': function(l, r) {
          return l === r;
        },
        '===': function(l, r) {
          return l === r;
        },
        '!=': function(l, r) {
          return l !== r;
        },
        '<': function(l, r) {
          return l < r;
        },
        '>': function(l, r) {
          return l > r;
        },
        '<=': function(l, r) {
          return l <= r;
        },
        '>=': function(l, r) {
          return l >= r;
        },
        'typeof': function(l, r) {
          return typeof l === r;
        }
      };
      if (!operators[operator]) {
        throw new Error("Helper 'compare' doesn't know the operator " + operator);
      }
      result = operators[operator](lvalue, rvalue);
      if (result) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    pad: function(stringOrArray, padAmount, unused) {
      var PAD, ret;
      stringOrArray = stringOrArray || '';
      padAmount = padAmount || 0;
      ret = '';
      PAD = require('string-padding');
      if (!String.is(stringOrArray)) {
        ret = stringOrArray.map(function(line) {
          return PAD(line, line.length + Math.abs(padAmount), null, padAmount < 0 ? PAD.LEFT : PAD.RIGHT);
        }).join('\n');
      } else {
        ret = PAD(stringOrArray, stringOrArray.length + Math.abs(padAmount), null, padAmount < 0 ? PAD.LEFT : PAD.RIGHT);
      }
      return ret;
    }
  };


  /**
  Report an error to the outside world without throwing an exception. Currently
  relies on kludging the running verb into. opts.
   */

  _reportError = function(code, params) {
    return GenericHelpers.opts.errHandler.err(code, params);
  };


  /**
  Format a from/to date range for display.
   */

  _fromTo = function(dateA, dateB, fmt, sep, fallback) {
    var dateATrim, dateBTrim, dateFrom, dateTemp, dateTo, reserved;
    if (moment.isMoment(dateA) || moment.isMoment(dateB)) {
      _reportError(HMSTATUS.invalidHelperUse, {
        helper: 'dateRange'
      });
      return '';
    }
    dateFrom = null;
    dateTo = null;
    dateTemp = null;
    dateA = dateA || '';
    dateB = dateB || '';
    dateATrim = dateA.trim().toLowerCase();
    dateBTrim = dateB.trim().toLowerCase();
    reserved = ['current', 'present', 'now', ''];
    fmt = (fmt && String.is(fmt) && fmt) || 'YYYY-MM';
    sep = (sep && String.is(sep) && sep) || ' — ';
    if (_.contains(reserved, dateATrim)) {
      dateFrom = fallback || '???';
    } else {
      dateTemp = FluentDate.fmt(dateA);
      dateFrom = dateTemp.format(fmt);
    }
    if (_.contains(reserved, dateBTrim)) {
      dateTo = fallback || 'Present';
    } else {
      dateTemp = FluentDate.fmt(dateB);
      dateTo = dateTemp.format(fmt);
    }
    if (dateFrom && dateTo) {
      return dateFrom + sep + dateTo;
    } else if (dateFrom || dateTo) {
      return dateFrom || dateTo;
    }
    return '';
  };

  skillLevelToIndex = function(lvl) {
    var idx, intVal;
    idx = 0;
    if (String.is(lvl)) {
      lvl = lvl.trim().toLowerCase();
      intVal = parseInt(lvl);
      if (isNaN(intVal)) {
        switch (lvl) {
          case 'beginner':
            idx = 1;
            break;
          case 'intermediate':
            idx = 2;
            break;
          case 'advanced':
            idx = 3;
            break;
          case 'master':
            idx = 4;
        }
      } else {
        idx = Math.min(intVal / 2, 4);
        idx = Math.max(0, idx);
      }
    } else {
      idx = Math.min(lvl / 2, 4);
      idx = Math.max(0, idx);
    }
    return idx;
  };

}).call(this);

//# sourceMappingURL=generic-helpers.js.map
