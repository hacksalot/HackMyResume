/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the TemplateGenerator class. TODO: Refactor
@module generators/template-generator
@license MIT. See LICENSE.md for details.
*/



const FS = require('fs-extra');
const _ = require('underscore');
const MD = require('marked');
const XML = require('xml-escape');
const PATH = require('path');
const parsePath = require('parse-filepath');
const MKDIRP = require('mkdirp');
const BaseGenerator = require('./base-generator');
const EXTEND = require('extend');



/**
TemplateGenerator performs resume generation via local Handlebar or Underscore
style template expansion and is appropriate for text-based formats like HTML,
plain text, and XML versions of Microsoft Word, Excel, and OpenOffice.
@class TemplateGenerator
*/

class TemplateGenerator extends BaseGenerator {



  /** Constructor. Set the output format and template format for this
  generator. Will usually be called by a derived generator such as
  HTMLGenerator or MarkdownGenerator. */

  constructor( outputFormat, templateFormat/*, cssFile */) {
    super(outputFormat);
    this.tplFormat = templateFormat || outputFormat;
  }



  /** Generate a resume using string-based inputs and outputs without touching
  the filesystem.
  @method invoke
  @param rez A FreshResume object.
  @param opts Generator options.
  @returns {Array} An array of objects representing the generated output
  files. */

  invoke( rez, opts ) {

    opts =
      opts
      ? (this.opts = EXTEND( true, { }, _defaultOpts, opts ))
      : this.opts;

    // Sort such that CSS files are processed before others
    const curFmt = opts.themeObj.getFormat( this.format );
    curFmt.files = _.sortBy(curFmt.files, fi => fi.ext !== 'css');

    // Run the transformation!
    const results = curFmt.files.map(function( tplInfo, idx ) {
      let trx;
      if (tplInfo.action === 'transform') {
        trx = this.transform(rez, tplInfo.data, this.format, opts, opts.themeObj, curFmt);
        if (tplInfo.ext === 'css') {
          curFmt.files[idx].data = trx;
        } else { tplInfo.ext === 'html'; }
      }
          //tplInfo.css contains the CSS data loaded by theme
          //tplInfo.cssPath contains the absolute path to the source CSS File
      //else {}
        // Images and non-transformable binary files
      if (typeof opts.onTransform === 'function') {
        opts.onTransform(tplInfo);
      }
      return {info: tplInfo, data: trx};
    }
    , this);

    return {files: results};
  }



  /** Generate a resume using file-based inputs and outputs. Requires access
  to the local filesystem.
  @method generate
  @param rez A FreshResume object.
  @param f Full path to the output resume file to generate.
  @param opts Generator options. */

  generate( rez, f, opts ) {

    // Prepare
    this.opts = EXTEND(true, { }, _defaultOpts, opts);

    // Call the string-based generation method
    const genInfo = this.invoke(rez, null);
    const outFolder = parsePath( f ).dirname;
    const curFmt = opts.themeObj.getFormat(this.format);

    // Process individual files within this format. For example, the HTML
    // output format for a theme may have multiple HTML files, CSS files,
    // etc. Process them here.
    genInfo.files.forEach(function( file ) {

      // console.dir _.omit(file.info,'cssData','data','css' )

      // Pre-processing
      file.info.orgPath = file.info.orgPath || '';
      const thisFilePath =
        file.info.primary
        ? f
        : PATH.join(outFolder, file.info.orgPath);

      if ((file.info.action !== 'copy') && this.onBeforeSave) {
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

      // Write the file
      if (typeof opts.beforeWrite === 'function') {
        opts.beforeWrite({data: thisFilePath});
      }
      MKDIRP.sync(PATH.dirname( thisFilePath ));

      if (file.info.action !== 'copy') {
        FS.writeFileSync(thisFilePath, file.data, {encoding: 'utf8', flags: 'w'});
      } else {
        FS.copySync(file.info.path, thisFilePath);
      }
      if (typeof opts.afterWrite === 'function') {
        opts.afterWrite({data: thisFilePath});
      }

      // Post-processing
      if (this.onAfterSave) {
        return this.onAfterSave({outputFile: thisFilePath, mk: file.data, opts: this.opts});
      }
    }

    , this);

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

  transform( json, jst, format, opts, theme, curFmt ) {
    if (this.opts.freezeBreaks) {
      jst = freeze(jst);
    }
    const eng = require(`../renderers/${theme.engine}-generator`);
    let result = eng.generate(json, jst, format, curFmt, opts, theme);
    if (this.opts.freezeBreaks) {
      result = unfreeze(result);
    }
    return result;
  }
}


module.exports = TemplateGenerator;



var createSymLinks = function( curFmt, outFolder ) {
  // Some themes require a symlink structure. If so, create it.
  if (curFmt.symLinks) {
    Object.keys( curFmt.symLinks ).forEach(function(loc) {
      const absLoc = PATH.join(outFolder, loc);
      const absTarg = PATH.join(PATH.dirname(absLoc), curFmt.symLinks[loc]);
      // Set type to 'file', 'dir', or 'junction' (Windows only)
      const type = parsePath( absLoc ).extname ? 'file' : 'junction';

      try {
        return FS.symlinkSync(absTarg, absLoc, type);
      } catch (err) {
        let succeeded = false;
        if (err.code === 'EEXIST') {
          FS.unlinkSync(absLoc);
          try {
            FS.symlinkSync(absTarg, absLoc, type);
            succeeded = true;
          } catch (error) {
            throw error;
          }
        }
        if (!succeeded) {
          throw err;
        }
      }
    });
    return;
  }
};


/** Freeze newlines for protection against errant JST parsers. */
var freeze = function( markup ) {
  markup.replace( _reg.regN, _defaultOpts.nSym );
  return markup.replace( _reg.regR, _defaultOpts.rSym );
};



/** Unfreeze newlines when the coast is clear. */
var unfreeze = function( markup ) {
  markup.replace(_reg.regSymR, '\r');
  return markup.replace(_reg.regSymN, '\n');
};



/** Default template generator options. */
var _defaultOpts = {
  engine: 'underscore',
  keepBreaks: true,
  freezeBreaks: false,
  nSym: '&newl;', // newline entity
  rSym: '&retn;', // return entity
  template: {
    interpolate: /\{\{(.+?)\}\}/g,
    escape: /\{\{=(.+?)\}\}/g,
    evaluate: /\{%(.+?)%\}/g,
    comment: /\{#(.+?)#\}/g
  },
  filters: {
    out( txt ) { return txt; },
    raw( txt ) { return txt; },
    xml( txt ) { return XML(txt); },
    md( txt ) { return MD( txt || '' ); },
    mdin( txt ) { return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, ''); },
    lower( txt ) { return txt.toLowerCase(); },
    link( name, url ) {
      if (url) { return `<a href="${url}">${name}</a>`; } else { return name; }
    }
  },
  prettify: { // ← See https://github.com/beautify-web/js-beautify#options
    indent_size: 2,
    unformatted: ['em','strong','a'],
    max_char: 80
  } // ← See lib/html.js in above-linked repo
};
    //wrap_line_length: 120, <-- Don't use this



/** Regexes for linebreak preservation. */
/* eslint-disable no-control-regex */
var _reg = {
  regN: new RegExp( '\n', 'g' ),
  regR: new RegExp( '\r', 'g' ),
  regSymN: new RegExp( _defaultOpts.nSym, 'g' ),
  regSymR: new RegExp( _defaultOpts.rSym, 'g' )
};
/* eslint-enable no-control-regex */
