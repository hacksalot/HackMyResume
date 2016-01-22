/**
Definition of the TemplateGenerator class. TODO: Refactor
@license MIT. See LICENSE.md for details.
@module template-generator.js
*/



(function() {



  var FS = require( 'fs-extra' )
    , _ = require( 'underscore' )
    , MD = require( 'marked' )
    , XML = require( 'xml-escape' )
    , PATH = require('path')
    , parsePath = require('parse-filepath')
    , MKDIRP = require('mkdirp')
    , BaseGenerator = require( './base-generator' )
    , EXTEND = require('extend')
    , FRESHTheme = require('../core/fresh-theme')
    , JRSTheme = require('../core/jrs-theme');



  /**
  TemplateGenerator performs resume generation via local Handlebar or Underscore
  style template expansion and is appropriate for text-based formats like HTML,
  plain text, and XML versions of Microsoft Word, Excel, and OpenOffice.
  @class TemplateGenerator
  */
  var TemplateGenerator = module.exports = BaseGenerator.extend({



    /** Constructor. Set the output format and template format for this
    generator. Will usually be called by a derived generator such as
    HTMLGenerator or MarkdownGenerator. */

    init: function( outputFormat, templateFormat, cssFile ){
      this._super( outputFormat );
      this.tplFormat = templateFormat || outputFormat;
    },



    /** Generate a resume using string-based inputs and outputs without touching
    the filesystem.
    @method invoke
    @param rez A FreshResume object.
    @param opts Generator options.
    @returns {Array} An array of objects representing the generated output
    files. */

    invoke: function( rez, opts ) {

      opts = opts ?
        (this.opts = EXTEND( true, { }, _defaultOpts, opts )) :
        this.opts;

      // Sort such that CSS files are processed before others
      var curFmt = opts.themeObj.getFormat( this.format );
      curFmt.files = _.sortBy( curFmt.files, function(fi) {
        return fi.ext !== 'css';
      });

      // Run the transformation!
      var results = curFmt.files.map( function( tplInfo, idx ) {
        var trx = this.single( rez, tplInfo.data, this.format, opts, opts.themeObj, curFmt );
        if( tplInfo.ext === 'css' ) { curFmt.files[idx].data = trx; }
        else if( tplInfo.ext === 'html' ) {
          //tplInfo.css contains the CSS data loaded by theme
          //tplInfo.cssPath contains the absolute path to the source CSS File
        }
        return { info: tplInfo, data: trx };
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
    @param opts Generator options. */

    generate: function( rez, f, opts ) {

      // Prepare
      this.opts = EXTEND( true, { }, _defaultOpts, opts );

      // Call the string-based generation method to perform the generation.
      var genInfo = this.invoke( rez, null );

      var outFolder = parsePath( f ).dirname;
      var curFmt = opts.themeObj.getFormat( this.format );

      // Process individual files within this format. For example, the HTML
      // output format for a theme may have multiple HTML files, CSS files,
      // etc. Process them here.
      genInfo.files.forEach(function( file ){

        // Pre-processing
        file.info.orgPath = file.info.orgPath || ''; // <-- For JRS themes
        var thisFilePath = PATH.join( outFolder, file.info.orgPath );
        if( this.onBeforeSave ) {
          file.data = this.onBeforeSave({
            theme: opts.themeObj,
            outputFile: (file.info.major ? f : thisFilePath),
            mk: file.data,
            opts: this.opts
          });
          if( !file.data ) return; // PDF etc
        }

        // Write the file
        var fileName = file.info.major ? f : thisFilePath;
        MKDIRP.sync( PATH.dirname( fileName ) );
        FS.writeFileSync( fileName, file.data,
          { encoding: 'utf8', flags: 'w' } );

        // Post-processing
        this.onAfterSave && this.onAfterSave(
          { outputFile: fileName, mk: file.data, opts: this.opts } );

      }, this);

      // Some themes require a symlink structure. If so, create it.
      if( curFmt.symLinks ) {
        Object.keys( curFmt.symLinks ).forEach( function(loc) {
          var absLoc = PATH.join(outFolder, loc);
          var absTarg = PATH.join(PATH.dirname(absLoc), curFmt.symLinks[loc]);
           // 'file', 'dir', or 'junction' (Windows only)
          var type = parsePath( absLoc ).extname ? 'file' : 'junction';
          FS.symlinkSync( absTarg, absLoc, type);
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
    @param opts Options and passthrough data. */

    single: function( json, jst, format, opts, theme, curFmt ) {
      this.opts.freezeBreaks && ( jst = freeze(jst) );

      var eng = require( '../renderers/' + theme.engine  + '-generator' );
      var result = eng.generate( json, jst, format, curFmt, opts, theme );

      this.opts.freezeBreaks && ( result = unfreeze(result) );
      return result;
    }


  });



  /** Export the TemplateGenerator function/ctor. */
  module.exports = TemplateGenerator;




  /** Freeze newlines for protection against errant JST parsers. */
  function freeze( markup ) {
    return markup
      .replace( _reg.regN, _defaultOpts.nSym )
      .replace( _reg.regR, _defaultOpts.rSym );
  }



  /** Unfreeze newlines when the coast is clear. */
  function unfreeze( markup ) {
    return markup
      .replace( _reg.regSymR, '\r' )
      .replace( _reg.regSymN, '\n' );
  }



  /** Default template generator options. */
  var _defaultOpts = {
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
      out: function( txt ) { return txt; },
      raw: function( txt ) { return txt; },
      xml: function( txt ) { return XML(txt); },
      md: function( txt ) { return MD( txt || '' ); },
      mdin: function( txt ) {
        return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
      },
      lower: function( txt ) { return txt.toLowerCase(); },
      link: function( name, url ) { return url ?
        '<a href="' + url + '">' + name + '</a>' : name; }
    },
    prettify: { // ← See https://github.com/beautify-web/js-beautify#options
      indent_size: 2,
      unformatted: ['em','strong','a'],
      max_char: 80, // ← See lib/html.js in above-linked repo
      //wrap_line_length: 120, <-- Don't use this
    }
  };



  /** Regexes for linebreak preservation. */
  var _reg = {
    regN: new RegExp( '\n', 'g' ),
    regR: new RegExp( '\r', 'g' ),
    regSymN: new RegExp( _defaultOpts.nSym, 'g' ),
    regSymR: new RegExp( _defaultOpts.rSym, 'g' )
  };



}());
