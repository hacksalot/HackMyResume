/**
Internal resume generation logic for FluentCV.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk
@module fluentcmd.js
*/

module.exports = function () {

  // We don't mind pseudo-globals here
  var path = require( 'path' )
    , extend = require( './utils/extend' )
    , unused = require('./utils/string')
    , FS = require('fs')
    , _ = require('underscore')
    , FLUENT = require('./fluentlib')
    , PATH = require('path')
    , MKDIRP = require('mkdirp')
    //, COLORS = require('colors')
    , rez, _log, _err;

  /**
  Given a source JSON resume, a destination resume path, and a theme file,
  generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the target resume file(s).
  @param theme Friendly name of the resume theme. Defaults to "modern".
  @param logger Optional logging override.
  */
  function generate( src, dst, opts, logger, errHandler ) {

    _log = logger || console.log;
    _err = errHandler || error;

    //_opts = extend( true, _opts, opts );
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim()) || 'modern';
    _opts.prettify = opts.prettify === true ? _opts.prettify : false;

    // Load input resumes...
    if(!src || !src.length) { throw { fluenterror: 3 }; }
    var sheets = loadSourceResumes( src );

    // Merge input resumes...
    var msg = '';
    rez = _.reduceRight( sheets, function( a, b, idx ) {
      msg += ((idx == sheets.length - 2) ? 'Merging '.gray + a.imp.fileName : '')
        + ' onto '.gray + b.imp.fileName;
      return extend( true, b, a );
    });
    msg && _log(msg);

    // Verify the specified theme name/path
    var relativeThemeFolder = '../node_modules/fluent-themes/themes';
    var tFolder = PATH.resolve( __dirname, relativeThemeFolder, _opts.theme );
    var exists = require('./utils/file-exists');
    if (!exists( tFolder )) {
      tFolder = PATH.resolve( _opts.theme );
      if (!exists( tFolder )) {
        throw { fluenterror: 1, data: _opts.theme };
      }
    }

    // Load the theme
    var theTheme = new FLUENT.Theme().open( tFolder );
    _opts.themeObj = theTheme;
    _log( 'Applying '.info + theTheme.name.toUpperCase().infoBold + (' theme (' +
      Object.keys(theTheme.formats).length + ' formats)').info );

    // Expand output resumes... (can't use map() here)
    var targets = [], that = this;
    ( (dst && dst.length && dst) || ['resume.all'] ).forEach( function(t) {

      var to = path.resolve(t),
          pa = path.parse(to),
          fmat = pa.ext || '.all';

      targets.push.apply(targets, fmat === '.all' ?
        Object.keys( theTheme.formats ).map(function(k){
          var z = theTheme.formats[k];
          return { file: to.replace(/all$/g,z.outFormat), fmt: z }
        }) : [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]);

    });

    // Run the transformation!
    var finished = targets.map( function(t) { return single(t, theTheme); } );

    // Don't send the client back empty-handed
    return { sheet: rez, targets: targets, processed: finished };
  }

  /**
  Generate a single resume of a specific format.
  @param f Full path to the destination resume to generate, for example,
  "/foo/bar/resume.pdf" or "c:\foo\bar\resume.txt".
  */
  function single( targetInfo, theme ) {
    try {
      var f = targetInfo.file, fType = targetInfo.fmt.outFormat, fName = path.basename(f,'.'+fType);

      if( targetInfo.fmt.files && targetInfo.fmt.files.length ) {
        targetInfo.fmt.files.forEach( function( form ) {

          if( form.ext === 'css' )
            return;

          _log( 'Generating '.useful + targetInfo.fmt.outFormat.toUpperCase().useful.bold + ' resume: '.useful +
            path.relative(process.cwd(), f ).useful.bold );

          var theFormat = _fmts.filter(
            function( fmt ) { return fmt.name === targetInfo.fmt.outFormat; })[0];

          MKDIRP.sync( path.dirname( f ) ); // Ensure dest folder exists;
          theFormat.gen.generate( rez, f, _opts );

        });
      }
      else {
        _log( 'Generating '.useful + targetInfo.fmt.outFormat.toUpperCase().useful.bold + ' resume: '.useful +
          path.relative(process.cwd(), f ).useful.bold );

        var theFormat = _fmts.filter(
          function( fmt ) { return fmt.name === targetInfo.fmt.outFormat; })[0];
        MKDIRP.sync( path.dirname( f ) ); // Ensure dest folder exists;
        theFormat.gen.generate( rez, f, _opts );
      }
    }
    catch( ex ) {
      _err( ex );
    }
  }

  /**
  Handle an exception.
  */
  function error( ex ) {
    throw ex;
  }

  /**
  Validate 1 to N resumes in either FRESH or JSON Resume format.
  */
  function validate( src, unused, opts, logger ) {
    _log = logger || console.log;
    if( !src || !src.length ) { throw { fluenterror: 6 }; }
    var isValid = true;

    var validator = require('is-my-json-valid');
    var schemas = {
      fresh: require('FRESCA'),
      jars: require('./core/resume.json')
    };

    // Load input resumes...
    var sheets = loadSourceResumes(src, function( res ) {
      try {
        return {
          file: res,
          raw: FS.readFileSync( res, 'utf8' )
        };
      }
      catch( ex ) {
        throw ex;
      }
    });

    sheets.forEach( function( rep ) {

      try {
        var rez = JSON.parse( rep.raw );
      }
      catch( ex ) {
        _log('Validating '.info + rep.file.infoBold + ' against FRESH/JRS schema: '.info + 'ERROR!'.error.bold);

        if (ex instanceof SyntaxError) {
          // Invalid JSON
          _log( '--> '.bold.red + rep.file.toUpperCase().red + ' contains invalid JSON. Unable to validate.'.red );
          _log( ('    INTERNAL: ' + ex).red );
        }
        else {

          _log(('ERROR: ' + ex.toString()).red.bold);
        }
        return;
      }

      var isValid = false;
      var style = 'useful';
      var errors = [];

      try {



        var fmt = rez.meta && rez.meta.format === 'FRESH@0.1.0' ? 'fresh':'jars';
        var validate = validator( schemas[ fmt ], { // Note [1]
          formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
        });

        isValid = validate( rez );
        if( !isValid ) {
          style = 'warn';
          errors = validate.errors;
        }

      }
      catch(ex) {

      }

      _log( 'Validating '.info + rep.file.infoBold + ' against '.info +
        fmt.replace('jars','JSON Resume').toUpperCase().infoBold + ' schema: '.info + (isValid ? 'VALID!' : 'INVALID')[style].bold );

      errors.forEach(function(err,idx){
        _log( '--> '.bold.yellow + ( err.field.replace('data.','resume.').toUpperCase()
          + ' ' + err.message).yellow );
      });



    });
  }

  /**
  Convert between FRESH and JRS formats.
  */
  function convert( src, dst, opts, logger ) {
    _log = logger || console.log;
    if( !src || !src.length ) { throw { fluenterror: 6 }; }
    if( !dst || !dst.length ) {
      if( src.length === 1 ) { throw { fluenterror: 5 }; }
      else if( src.length === 2 ) { dst = [ src[1] ]; src = [ src[0] ]; }
      else { throw { fluenterror: 5 }; }
    }
    if( src && dst && src.length && dst.length && src.length !== dst.length ) {
      throw { fluenterror: 7 };
    }
    var sheets = loadSourceResumes( src );
    sheets.forEach(function(sheet, idx){
      var sourceFormat = sheet.imp.orgFormat === 'JRS' ? 'JRS' : 'FRESH';
      var targetFormat = sourceFormat === 'JRS' ? 'FRESH' : 'JRS';
      _log( 'Converting '.useful + sheet.imp.fileName.useful.bold + (' (' + sourceFormat + ') to ').useful + dst[0].useful.bold +
        (' (' + targetFormat + ').').useful );
      sheet.saveAs( dst[idx], targetFormat );
    });
  }

  /**
  Create a new empty resume in either FRESH or JRS format.
  */
  function create( src, dst, opts, logger ) {
    _log = logger || console.log;
    dst = src || ['resume.json'];
    dst.forEach( function( t ) {
      var safeFormat = opts.format.toUpperCase();
      _log('Creating new '.useful +safeFormat.useful.bold+ ' resume: '.useful + t.useful.bold);
      MKDIRP.sync( path.dirname( t ) ); // Ensure dest folder exists;
      FLUENT[ safeFormat + 'Resume' ].default().save( t );
    });
  }

  /**
  Display help documentation.
  */
  function help() {
    console.log( FS.readFileSync( PATH.join(__dirname, 'use.txt'), 'utf8' ).useful.bold );
  }

  function loadSourceResumes( src, fn ) {
    return src.map( function( res ) {
      _log( 'Reading '.info + 'SOURCE'.infoBold + ' resume: '.info + res.cyan.bold );
      return (fn && fn(res)) || (new FLUENT.FRESHResume()).open( res );
    });
  }

  /**
  Supported resume formats.
  */
  var _fmts = [
    { name: 'html', ext: 'html', gen: new FLUENT.HtmlGenerator() },
    { name: 'txt',  ext: 'txt', gen: new FLUENT.TextGenerator()  },
    { name: 'doc',  ext: 'doc',  fmt: 'xml', gen: new FLUENT.WordGenerator() },
    { name: 'pdf',  ext: 'pdf', fmt: 'html', is: false, gen: new FLUENT.HtmlPdfGenerator() },
    { name: 'md', ext: 'md', fmt: 'txt', gen: new FLUENT.MarkdownGenerator() },
    { name: 'json', ext: 'json', gen: new FLUENT.JsonGenerator() },
    { name: 'yml', ext: 'yml', fmt: 'yml', gen: new FLUENT.JsonYamlGenerator() },
    { name: 'latex', ext: 'tex', fmt: 'latex', gen: new FLUENT.LaTeXGenerator() }
  ];

  /**
  Default FluentCV options.
  */
  var _opts = {
    theme: 'modern',
    prettify: { // ← See https://github.com/beautify-web/js-beautify#options
      indent_size: 2,
      unformatted: ['em','strong'],
      max_char: 80, // ← See lib/html.js in above-linked repo
      //wrap_line_length: 120, ← Don't use this
    }
  };

  /**
  Internal module interface. Used by FCV Desktop and HMR.
  */
  return {
    verbs: {
      build: generate,
      validate: validate,
      convert: convert,
      new: create,
      help: help
    },
    lib: require('./fluentlib'),
    options: _opts,
    formats: _fmts
  };

}();

// [1]: JSON.parse throws SyntaxError on invalid JSON. See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
