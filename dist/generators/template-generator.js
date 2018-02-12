(function() {
  /**
  Definition of the TemplateGenerator class. TODO: Refactor
  @module generators/template-generator
  @license MIT. See LICENSE.md for details.
  */
  /** Default template generator options. */
  /** Freeze newlines for protection against errant JST parsers. */
  /** Unfreeze newlines when the coast is clear. */
  var BaseGenerator, EXTEND, FRESHTheme, FS, JRSTheme, MD, MKDIRP, PATH, TemplateGenerator, XML, _, _defaultOpts, _reg, createSymLinks, freeze, parsePath, unfreeze;

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
  module.exports = TemplateGenerator = class TemplateGenerator extends BaseGenerator {
    /** Constructor. Set the output format and template format for this
    generator. Will usually be called by a derived generator such as
    HTMLGenerator or MarkdownGenerator. */
    constructor(outputFormat, templateFormat, cssFile) {
      super(outputFormat);
      this.tplFormat = templateFormat || outputFormat;
      return;
    }

    /** Generate a resume using string-based inputs and outputs without touching
    the filesystem.
    @method invoke
    @param rez A FreshResume object.
    @param opts Generator options.
    @returns {Array} An array of objects representing the generated output
    files. */
    invoke(rez, opts) {
      var curFmt, results;
      opts = opts ? (this.opts = EXTEND(true, {}, _defaultOpts, opts)) : this.opts;
      // Sort such that CSS files are processed before others
      curFmt = opts.themeObj.getFormat(this.format);
      curFmt.files = _.sortBy(curFmt.files, function(fi) {
        return fi.ext !== 'css';
      });
      // Run the transformation!
      results = curFmt.files.map(function(tplInfo, idx) {
        var trx;
        if (tplInfo.action === 'transform') {
          trx = this.transform(rez, tplInfo.data, this.format, opts, opts.themeObj, curFmt);
          if (tplInfo.ext === 'css') {
            curFmt.files[idx].data = trx;
          } else {
            tplInfo.ext === 'html';
          }
        } else {

        }
        if (typeof opts.onTransform === "function") {
          opts.onTransform(tplInfo);
        }
        return {
          info: tplInfo,
          data: trx
        };
      }, this);
      return {
        files: results
      };
    }

    /** Generate a resume using file-based inputs and outputs. Requires access
    to the local filesystem.
    @method generate
    @param rez A FreshResume object.
    @param f Full path to the output resume file to generate.
    @param opts Generator options. */
    generate(rez, f, opts) {
      var curFmt, genInfo, outFolder;
      // Prepare
      this.opts = EXTEND(true, {}, _defaultOpts, opts);
      // Call the string-based generation method
      genInfo = this.invoke(rez, null);
      outFolder = parsePath(f).dirname;
      curFmt = opts.themeObj.getFormat(this.format);
      // Process individual files within this format. For example, the HTML
      // output format for a theme may have multiple HTML files, CSS files,
      // etc. Process them here.
      genInfo.files.forEach(function(file) {
        var thisFilePath;
        // console.dir _.omit(file.info,'cssData','data','css' )

        // Pre-processing
        file.info.orgPath = file.info.orgPath || '';
        thisFilePath = file.info.primary ? f : PATH.join(outFolder, file.info.orgPath);
        if (file.info.action !== 'copy' && this.onBeforeSave) {
          file.data = this.onBeforeSave({
            theme: opts.themeObj,
            outputFile: thisFilePath,
            mk: file.data,
            opts: this.opts,
            ext: file.info.ext
          });
          if (!file.data) {
            return;
          }
        }
        if (typeof opts.beforeWrite === "function") {
          opts.beforeWrite({
            data: thisFilePath
          });
        }
        MKDIRP.sync(PATH.dirname(thisFilePath));
        if (file.info.action !== 'copy') {
          FS.writeFileSync(thisFilePath, file.data, {
            encoding: 'utf8',
            flags: 'w'
          });
        } else {
          FS.copySync(file.info.path, thisFilePath);
        }
        if (typeof opts.afterWrite === "function") {
          opts.afterWrite({
            data: thisFilePath
          });
        }
        // Post-processing
        if (this.onAfterSave) {
          return this.onAfterSave({
            outputFile: fileName,
            mk: file.data,
            opts: this.opts
          });
        }
      }, this);
      // Some themes require a symlink structure. If so, create it.
      createSymLinks(curFmt, outFolder);
      return genInfo;
    }

    /** Perform a single resume resume transformation using string-based inputs
    and outputs without touching the local file system.
    @param json A FRESH or JRS resume object.
    @param jst The stringified template data
    @param format The format name, such as "html" or "latex"
    @param cssInfo Needs to be refactored.
    @param opts Options and passthrough data. */
    transform(json, jst, format, opts, theme, curFmt) {
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

  };

  createSymLinks = function(curFmt, outFolder) {
    // Some themes require a symlink structure. If so, create it.
    if (curFmt.symLinks) {
      Object.keys(curFmt.symLinks).forEach(function(loc) {
        var absLoc, absTarg, err, succeeded, type;
        absLoc = PATH.join(outFolder, loc);
        absTarg = PATH.join(PATH.dirname(absLoc), curFmt.symLinks[loc]);
        // Set type to 'file', 'dir', or 'junction' (Windows only)
        type = parsePath(absLoc).extname ? 'file' : 'junction';
        try {
          return FS.symlinkSync(absTarg, absLoc, type);
        } catch (error) {
          err = error;
          succeeded = false;
          if (err.code === 'EEXIST') {
            FS.unlinkSync(absLoc);
            try {
              FS.symlinkSync(absTarg, absLoc, type);
              succeeded = true;
            } catch (error) {}
          }
          if (!succeeded) {
            throw ex;
          }
        }
      });
    }
  };

  freeze = function(markup) {
    markup.replace(_reg.regN, _defaultOpts.nSym);
    return markup.replace(_reg.regR, _defaultOpts.rSym);
  };

  unfreeze = function(markup) {
    markup.replace(_reg.regSymR, '\r');
    return markup.replace(_reg.regSymN, '\n');
  };

  _defaultOpts = {
    engine: 'underscore',
    keepBreaks: true,
    freezeBreaks: false,
    nSym: '&newl;', // newline entity
    rSym: '&retn;', // return entity
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
      max_char: 80 // ← See lib/html.js in above-linked repo
    }
  };

  //wrap_line_length: 120, <-- Don't use this
  /** Regexes for linebreak preservation. */
  _reg = {
    regN: new RegExp('\n', 'g'),
    regR: new RegExp('\r', 'g'),
    regSymN: new RegExp(_defaultOpts.nSym, 'g'),
    regSymR: new RegExp(_defaultOpts.rSym, 'g')
  };

}).call(this);

//# sourceMappingURL=template-generator.js.map
