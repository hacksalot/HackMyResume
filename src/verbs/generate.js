(function() {

  var PATH = require('path')
    , parsePath = require('parse-filepath')
    , MKDIRP = require('mkdirp')
    , _opts = require('../core/default-options')
    , FluentTheme = require('../core/theme')
    , loadSourceResumes = require('../core/load-source-resumes')
    , _ = require('underscore')
    , _fmts = require('../core/default-formats')
    , _err, _log, rez;

  /**
  Handle an exception.
  */
  function error( ex ) {
    throw ex;
  }

  module.exports =

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
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim())|| 'modern';
    _opts.prettify = opts.prettify === true ? _opts.prettify : false;

    // Load input resumes...
    if( !src || !src.length ) { throw { fluenterror: 3 }; }
    var sheets = loadSourceResumes( src, _log );

    // Merge input resumes...
    var msg = '';
    rez = _.reduceRight( sheets, function( a, b, idx ) {
      msg += ((idx == sheets.length - 2) ?
      'Merging '.gray+ a.imp.fileName : '') + ' onto '.gray + b.imp.fileName;
      return extend( true, b, a );
    });
    msg && _log(msg);

    // Verify the specified theme name/path
    var relativeThemeFolder = '../../node_modules/fluent-themes/themes';
    var tFolder = PATH.resolve( __dirname, relativeThemeFolder, _opts.theme);
    var exists = require('path-exists').sync;
    if (!exists( tFolder )) {
      tFolder = PATH.resolve( _opts.theme );
      if (!exists( tFolder )) {
        throw { fluenterror: 1, data: _opts.theme };
      }
    }

    // Load the theme
    var theTheme = (new FluentTheme()).open( tFolder );
    _opts.themeObj = theTheme;
    _log( 'Applying '.info + theTheme.name.toUpperCase().infoBold +
      (' theme (' + Object.keys(theTheme.formats).length + ' formats)').info);

    // Expand output resumes... (can't use map() here)
    var targets = [], that = this;
    ( (dst && dst.length && dst) || ['resume.all'] ).forEach( function(t) {

      var to = PATH.resolve(t),
          pa = parsePath(to),
          fmat = pa.extname || '.all';

      targets.push.apply(targets, fmat === '.all' ?
        Object.keys( theTheme.formats ).map(function(k){
          var z = theTheme.formats[k];
          return { file: to.replace(/all$/g,z.outFormat), fmt: z };
        }) : [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]);

    });

    // Run the transformation!
    var finished = targets.map( function(t) { return single(t, theTheme); });

    // Don't send the client back empty-handed
    return { sheet: rez, targets: targets, processed: finished };
  };

  /**
  Generate a single resume of a specific format.
  @param f Full path to the destination resume to generate, for example,
  "/foo/bar/resume.pdf" or "c:\foo\bar\resume.txt".
  */
  function single( targInfo, theme ) {
    try {
      var f = targInfo.file
        , fType = targInfo.fmt.outFormat
        , fName = PATH.basename(f, '.' + fType)
        , theFormat;

      // If targInfo.fmt.files exists, this theme has an explicit "files"
      // section in its theme.json file.
      if( targInfo.fmt.files && targInfo.fmt.files.length ) {

        _log( 'Generating '.useful +
          targInfo.fmt.outFormat.toUpperCase().useful.bold +
          ' resume: '.useful + PATH.relative(process.cwd(), f ).replace(/\\/g,'/').useful.bold);

          theFormat = _fmts.filter(
            function(fmt) { return fmt.name === targInfo.fmt.outFormat; })[0];
          MKDIRP.sync( PATH.dirname( f ) ); // Ensure dest folder exists;
          theFormat.gen.generate( rez, f, _opts );

        // targInfo.fmt.files.forEach( function( form ) {
        //
        //   if( form.action === 'transform' ) {
        //     var theFormat = _fmts.filter( function( fmt ) {
        //       return fmt.name === targInfo.fmt.outFormat;
        //     })[0];
        //     MKDIRP.sync( PATH.dirname( f ) ); // Ensure dest folder exists;
        //     theFormat.gen.generate( rez, f, _opts );
        //   }
        //   else if( form.action === null ) {
        //     // Copy the file
        //   }
        //
        // });

      }
      // Otherwise the theme has no files section
      else {
        _log( 'Generating '.useful +
          targInfo.fmt.outFormat.toUpperCase().useful.bold +
          ' resume: '.useful + PATH.relative(process.cwd(), f ).replace(/\\/g,'/').useful.bold);

        theFormat = _fmts.filter(
          function(fmt) { return fmt.name === targInfo.fmt.outFormat; })[0];
        MKDIRP.sync( PATH.dirname( f ) ); // Ensure dest folder exists;
        theFormat.gen.generate( rez, f, _opts );
      }
    }
    catch( ex ) {
      _err( ex );
    }
  }

}());
