
/**
Definition of the TemplateGenerator class. TODO: Refactor
@license MIT. See LICENSE.md for details.
@module template-generator.js
 */

(function() {
  var BaseGenerator, EXTEND, FRESHTheme, FS, JRSTheme, MD, MKDIRP, PATH, TemplateGenerator, XML, _, _defaultOpts, _reg, freeze, parsePath, unfreeze;

  FS = require('fs-extra');

  _ = require('underscore');

  MD = require('marked');

  XML = require('xml-escape');

  PATH = require('path');

  parsePath = require('parse-filepath');

  MKDIRP = require('mkdirp');

  BaseGenerator = require('./base-generator');

  EXTEND = require('extend');

  FRESHTheme = require('../core/fresh-theme');

  JRSTheme = require('../core/jrs-theme');


  /**
  TemplateGenerator performs resume generation via local Handlebar or Underscore
  style template expansion and is appropriate for text-based formats like HTML,
  plain text, and XML versions of Microsoft Word, Excel, and OpenOffice.
  @class TemplateGenerator
   */

  TemplateGenerator = module.exports = BaseGenerator.extend({

    /** Constructor. Set the output format and template format for this
    generator. Will usually be called by a derived generator such as
    HTMLGenerator or MarkdownGenerator.
     */
    init: function(outputFormat, templateFormat, cssFile) {
      this._super(outputFormat);
      this.tplFormat = templateFormat || outputFormat;
    },

    /** Generate a resume using string-based inputs and outputs without touching
    the filesystem.
    @method invoke
    @param rez A FreshResume object.
    @param opts Generator options.
    @returns {Array} An array of objects representing the generated output
    files.
     */
    invoke: function(rez, opts) {
      var curFmt, results;
      opts = opts ? (this.opts = EXTEND(true, {}, _defaultOpts, opts)) : this.opts;
      curFmt = opts.themeObj.getFormat(this.format);
      curFmt.files = _.sortBy(curFmt.files, function(fi) {
        return fi.ext !== 'css';
      });
      results = curFmt.files.map(function(tplInfo, idx) {
        var trx;
        trx = this.single(rez, tplInfo.data, this.format, opts, opts.themeObj, curFmt);
        if (tplInfo.ext === 'css') {
          curFmt.files[idx].data = trx;
        } else {
          tplInfo.ext === 'html';
        }
        return {
          info: tplInfo,
          data: trx
        };
      }, this);
      return {
        files: results
      };
    },

    /** Generate a resume using file-based inputs and outputs. Requires access
    to the local filesystem.
    @method generate
    @param rez A FreshResume object.
    @param f Full path to the output resume file to generate.
    @param opts Generator options.
     */
    generate: function(rez, f, opts) {
      var curFmt, genInfo, outFolder;
      this.opts = EXTEND(true, {}, _defaultOpts, opts);
      genInfo = this.invoke(rez, null);
      outFolder = parsePath(f).dirname;
      curFmt = opts.themeObj.getFormat(this.format);
      genInfo.files.forEach(function(file) {
        var fileName, thisFilePath;
        file.info.orgPath = file.info.orgPath || '';
        thisFilePath = PATH.join(outFolder, file.info.orgPath);
        if (this.onBeforeSave) {
          file.data = this.onBeforeSave({
            theme: opts.themeObj,
            outputFile: file.info.major ? f : thisFilePath,
            mk: file.data,
            opts: this.opts
          });
          if (!file.data) {
            return;
          }
        }
        fileName = file.info.major ? f : thisFilePath;
        MKDIRP.sync(PATH.dirname(fileName));
        FS.writeFileSync(fileName, file.data, {
          encoding: 'utf8',
          flags: 'w'
        });
        if (this.onAfterSave) {
          return this.onAfterSave({
            outputFile: fileName,
            mk: file.data,
            opts: this.opts
          });
        }
      }, this);
      if (curFmt.symLinks) {
        Object.keys(curFmt.symLinks).forEach(function(loc) {
          var absLoc, absTarg, ref, type;
          absLoc = PATH.join(outFolder, loc);
          absTarg = PATH.join(PATH.dirname(absLoc), curFmt.symLinks[loc]);
          type = (ref = parsePath(absLoc).extname) != null ? ref : {
            'file': 'junction'
          };
          return FS.symlinkSync(absTarg, absLoc, type);
        });
      }
      return genInfo;
    },

    /** Perform a single resume resume transformation using string-based inputs
    and outputs without touching the local file system.
    @param json A FRESH or JRS resume object.
    @param jst The stringified template data
    @param format The format name, such as "html" or "latex"
    @param cssInfo Needs to be refactored.
    @param opts Options and passthrough data.
     */
    single: function(json, jst, format, opts, theme, curFmt) {
      var eng, result;
      if (this.opts.freezeBreaks) {
        jst = freeze(jst);
      }
      eng = require('../renderers/' + theme.engine + '-generator');
      result = eng.generate(json, jst, format, curFmt, opts, theme);
      if (this.opts.freezeBreaks) {
        result = unfreeze(result);
      }
      return result;
    }
  });


  /** Export the TemplateGenerator function/ctor. */

  module.exports = TemplateGenerator;


  /** Freeze newlines for protection against errant JST parsers. */

  freeze = function(markup) {
    markup.replace(_reg.regN, _defaultOpts.nSym);
    return markup.replace(_reg.regR, _defaultOpts.rSym);
  };


  /** Unfreeze newlines when the coast is clear. */

  unfreeze = function(markup) {
    markup.replace(_reg.regSymR, '\r');
    return markup.replace(_reg.regSymN, '\n');
  };


  /** Default template generator options. */

  _defaultOpts = {
    engine: 'underscore',
    keepBreaks: true,
    freezeBreaks: false,
    nSym: '&newl;',
    rSym: '&retn;',
    template: {
      interpolate: /\{\{(.+?)\}\}/g,
      escape: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\%(.+?)\%\}/g,
      comment: /\{\#(.+?)\#\}/g
    },
    filters: {
      out: function(txt) {
        return txt;
      },
      raw: function(txt) {
        return txt;
      },
      xml: function(txt) {
        return XML(txt);
      },
      md: function(txt) {
        return MD(txt || '');
      },
      mdin: function(txt) {
        return MD(txt || '').replace(/^\s*<p>|<\/p>\s*$/gi, '');
      },
      lower: function(txt) {
        return txt.toLowerCase();
      },
      link: function(name, url) {
        if (url) {
          return '<a href="' + url + '">' + name + '</a>';
        } else {
          return name;
        }
      }
    },
    prettify: {
      indent_size: 2,
      unformatted: ['em', 'strong', 'a'],
      max_char: 80
    }
  };


  /** Regexes for linebreak preservation. */

  _reg = {
    regN: new RegExp('\n', 'g'),
    regR: new RegExp('\r', 'g'),
    regSymN: new RegExp(_defaultOpts.nSym, 'g'),
    regSymR: new RegExp(_defaultOpts.rSym, 'g')
  };

}).call(this);

//# sourceMappingURL=template-generator.js.map
