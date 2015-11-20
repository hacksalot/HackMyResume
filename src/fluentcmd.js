/**
Internal resume generation logic for FluentCV.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk
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
    , rez, _log, _err;

  /**
  Given a source JSON resume, a destination resume path, and a theme file,
  generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the target resume file(s).
  @param theme Friendly name of the resume theme. Defaults to "modern".
  @param logger Optional logging override.
  */
  function gen( src, dst, opts, logger, errHandler ) {

    _log = logger || console.log;
    _err = errHandler || error;

    //_opts = extend( true, _opts, opts );
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim()) || 'modern';
    _opts.prettify = opts.prettify === true ? _opts.prettify : false;

    // Load input resumes...
    if(!src || !src.length) { throw { fluenterror: 3 }; }
    var sheets = src.map( function( res ) {
      _log( 'Reading JSON resume: ' + res );
      return (new FLUENT.FRESHResume()).open( res );
    });

    // Merge input resumes...
    var msg = '';
    rez = _.reduceRight( sheets, function( a, b, idx ) {
      msg += ((idx == sheets.length - 2) ? 'Merging ' + a.meta.fileName : '')
        + ' onto ' + b.meta.fileName;
      return extend( true, b, a );
    });
    msg && _log(msg);

    // Load the active theme
    // Verify the specified theme name/path
    var tFolder = PATH.resolve( __dirname, '../node_modules/fluent-themes/themes', _opts.theme );
    var exists = require('./utils/file-exists');
    if (!exists( tFolder )) {
      tFolder = PATH.resolve( _opts.theme );
      if (!exists( tFolder )) {
        throw { fluenterror: 1, data: _opts.theme };
      }
    }
    var theTheme = new FLUENT.Theme().open( tFolder );
    _opts.themeObj = theTheme;
    _log( 'Applying ' + theTheme.name.toUpperCase() + ' theme (' + Object.keys(theTheme.formats).length + ' formats)' );

    // Expand output resumes... (can't use map() here)
    var targets = [];
    var that = this;
    ( (dst && dst.length && dst) || ['resume.all'] ).forEach( function(t) {
      var to = path.resolve(t), pa = path.parse(to), fmat = pa.ext || '.all';
      targets.push.apply(targets, fmat === '.all' ?
        Object.keys( theTheme.formats ).map(function(k){ var z = theTheme.formats[k]; return { file: to.replace(/all$/g,z.pre), fmt: z } })
        : [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]);
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
  function single( fi, theme ) {
    try {
      var f = fi.file, fType = fi.fmt.ext, fName = path.basename( f, '.' + fType );
      var fObj = _.property( fi.fmt.pre )( theme.formats );
      var fOut = path.join( f.substring( 0, f.lastIndexOf('.') + 1 ) + fObj.pre );
      _log( 'Generating ' + fi.fmt.title.toUpperCase() + ' resume: ' + path.relative(process.cwd(), f ) );
      var theFormat = _fmts.filter( function( fmt ) {
        return fmt.name === fi.fmt.pre;
      })[0];
      MKDIRP( path.dirname(fOut) ); // Ensure dest folder exists; don't bug user
      theFormat.gen.generate( rez, fOut, _opts );
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
  Validate 1 to N resumes as vanilla JSON.
  */
  // function validateAsJSON( src, logger ) {
  //   _log = logger || console.log;
  //   if( !src || !src.length ) { throw { fluenterror: 3 }; }
  //   var isValid = true;
  //   var sheets = src.map( function( res ) {
  //     try {
  //       var rawJson = FS.readFileSync( res, 'utf8' );
  //       var testObj = JSON.parse( rawJson );
  //     }
  //     catch(ex) {
  //       if (!(ex instanceof SyntaxError)) { throw ex; } // [1]
  //       isValid = false;
  //     }
  //
  //     _log( 'Validating JSON resume: ' + res + (isValid ? ' (VALID)' : ' (INVALID)'));
  //     return isValid;
  //   });
  // }

  /**
  Validate 1 to N resumes in either FRESH or JSON Resume format.
  */
  function validate( src, unused, opts, logger ) {
    _log = logger || console.log;
    if( !src || !src.length ) { throw { fluenterror: 3 }; }
    var isValid = true;
    var sheets = src.map( function( res ) {
      var sheet = (new FLUENT.FRESHResume()).open( res );
      var valid = sheet.isValid();
      _log( 'Validating JSON resume: ' + res +
        (valid ? ' (VALID)' : ' (INVALID)'));
      if( !valid ) {
        _log( sheet.meta.validationErrors );
      }
    });
  }

  /**
  Convert between FRESH and JRS formats.
  */
  function convert( src, dst, opts, logger ) {
    _log = logger || console.log;
    if( !src || src.length !== 1 ) { throw { fluenterror: 3 }; }
    var sheet = (new FLUENT.FRESHResume()).open( src[ 0 ] );
    sheet.saveAs( dst[0], sheet.meta.orgFormat === 'JRS' ? 'FRESH' : 'JRS' );
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
    { name: 'yml', ext: 'yml', fmt: 'yml', gen: new FLUENT.JsonYamlGenerator() }
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
      generate: gen,
      validate: validate,
      convert: convert
    },
    lib: require('./fluentlib'),
    options: _opts,
    formats: _fmts
  };

}();

// [1]: JSON.parse throws SyntaxError on invalid JSON. See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
