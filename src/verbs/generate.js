(function() {

  var PATH = require('path')
    , FS = require('fs')
    , parsePath = require('parse-filepath')
    , MD = require('marked')
    , MKDIRP = require('mkdirp')
    , _opts = require('../core/default-options')
    , FluentTheme = require('../core/fresh-theme')
    , JRSTheme = require('../core/jrs-theme')
    , ResumeFactory = require('../core/resume-factory')
    , _ = require('underscore')
    , _fmts = require('../core/default-formats')
    , unused = require('string.prototype.startswith')
    , _err, _log, rez;

  /**
  Handle an exception.
  */
  function error( ex ) {
    throw ex;
  }

  module.exports =

  /**
  Given a source resume in FRESH or JRS format, a destination resume path, and a
  theme file, generate 0..N resumes in the desired formats.
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

    // Verify the specified theme name/path
    var relativeThemeFolder = '../../node_modules/fluent-themes/themes';
    var tFolder = PATH.resolve( __dirname, relativeThemeFolder, _opts.theme);
    var exists = require('path-exists').sync;
    if( !exists( tFolder ) ) {
      tFolder = PATH.resolve( _opts.theme );
      if (!exists( tFolder )) {
        throw { fluenterror: 1, data: _opts.theme };
      }
    }

    // Load the theme
    var theTheme = _opts.theme.startsWith('jsonresume-theme') ?
      new JRSTheme().open(tFolder) : new FluentTheme().open( tFolder );
    _opts.themeObj = theTheme;
    var numFormats = theTheme.formats ? Object.keys(theTheme.formats).length : 2;
    _log( 'Applying '.info + theTheme.name.toUpperCase().infoBold +
      (' theme (' + numFormats + ' formats)').info);

    // Load input resumes...
    if( !src || !src.length ) { throw { fluenterror: 3 }; }
    var sheets = ResumeFactory.load( src, _log, null,
      theTheme.render ? 'JRS' : 'FRESH' );

    // Merge input resumes...
    var msg = '';
    rez = _.reduceRight( sheets, function( a, b, idx ) {
      msg += ((idx == sheets.length - 2) ?
      'Merging '.gray+ a.imp.fileName : '') + ' onto '.gray + b.imp.fileName;
      return extend( true, b, a );
    });
    msg && _log(msg);

    // Expand output resumes... (can't use map() here)
    var targets = [], that = this;
    ( (dst && dst.length && dst) || ['resume.all'] ).forEach( function(t) {

      var to = PATH.resolve(t),
          pa = parsePath(to),
          fmat = pa.extname || '.all';

      targets.push.apply(
        targets, fmat === '.all' ?

        Object.keys( theTheme.formats ).map(function(k){
          var z = theTheme.formats[k];
          return { file: to.replace(/all$/g,z.outFormat), fmt: z };
        }) :

        [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]);

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

    function MDIN(txt) {
      return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
    }

    try {
      var f = targInfo.file
        , fType = targInfo.fmt.outFormat
        , fName = PATH.basename(f, '.' + fType)
        , theFormat;

      // If targInfo.fmt.files exists, this format is backed by a document.
      // Fluent/FRESH themes are handled here.
      if( targInfo.fmt.files && targInfo.fmt.files.length ) {

        _log( 'Generating '.useful +
          targInfo.fmt.outFormat.toUpperCase().useful.bold +
          ' resume: '.useful + PATH.relative(process.cwd(), f ).replace(/\\/g,'/').useful.bold);

          theFormat = _fmts.filter(
            function(fmt) { return fmt.name === targInfo.fmt.outFormat; })[0];
          MKDIRP.sync( PATH.dirname( f ) ); // Ensure dest folder exists;
          theFormat.gen.generate( rez, f, _opts );
      }

      // Otherwise this is either a) a JSON Resume theme or b) an ad-hoc format
      // (JSON, YML, or PNG) that every theme gets "for free".
      else {
        _log( 'Generating '.useful +
          targInfo.fmt.outFormat.toUpperCase().useful.bold +
          ' resume: '.useful + PATH.relative(process.cwd(), f ).replace(/\\/g,'/').useful.bold);

        theFormat = _fmts.filter( function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];

        var outFolder = PATH.dirname( f );
        MKDIRP.sync( outFolder ); // Ensure dest folder exists;

        // JSON Resume themes have a 'render' method that needs to be called
        if( theme.render ) {
          var COPY = require('copy');
          var globs = [ /*'**',*/ '*.css', '*.js', '*.png', '*.jpg', '*.gif', '*.bmp' ];
          COPY.sync( globs , outFolder, {
            cwd: theme.folder, nodir: true,
            ignore: ['node_modules/','node_modules/**']
            // rewrite: function(p1, p2) {
            //   return PATH.join(p2, p1);
            // }
          });

          // Prevent JSON Resume theme .js from chattering (TODO: redirect IO)
          var consoleLog = console.log;
          console.log = function() { };

          // Call the theme's render method
          var rezDupe = rez.harden();
          var rezHtml = theme.render( rezDupe );

          // Turn logging back on
          console.log = consoleLog;

          // Unharden
          rezHtml = rezHtml.replace( /@@@@~.+?~@@@@/g, function(val){
            return MDIN( val.replace( /~@@@@/gm,'' ).replace( /@@@@~/gm,'' ) );
          });

          // Save the file
          FS.writeFileSync( f, rezHtml );
        }
        else {
          theFormat.gen.generate( rez, f, _opts );
        }
      }
    }
    catch( ex ) {
      _err( ex );
    }
  }

}());
