/**
Implementation of the 'build' verb for HackMyResume.
@module verbs/build
@license MIT. See LICENSE.md for details.
*/



(function() {



  var PATH           = require('path')
    , FS             = require('fs')
    , MD             = require('marked')
    , MKDIRP         = require('mkdirp')
    , EXTEND         = require('../utils/extend')
    , HMSTATUS       = require('../core/status-codes')
    , HMEVENT        = require('../core/event-codes')
    , RConverter     = require('fresh-jrs-converter')
    , RTYPES         = { FRESH: require('../core/fresh-resume'),
                         JRS: require('../core/jrs-resume') }
    , parsePath      = require('parse-filepath')
    , _opts          = require('../core/default-options')
    , FluentTheme    = require('../core/fresh-theme')
    , JRSTheme       = require('../core/jrs-theme')
    , ResumeFactory  = require('../core/resume-factory')
    , _              = require('underscore')
    , _fmts          = require('../core/default-formats')
    , extend         = require('../utils/extend')
    , chalk          = require('chalk')
    , pad            = require('string-padding')
    , Verb           = require('../verbs/verb');

  var _err, _log, rez;



  /** An invokable resume generation command. */
  var BuildVerb = module.exports = Verb.extend({

    /** Create a new build verb. */
    init: function() {
      this._super('build');
    },

    /** Invoke the Build command. */
    invoke: function() {
      this.stat( HMEVENT.begin, { cmd: 'build' } );
      build.apply( this, arguments );
      this.stat( HMEVENT.end );
    }

  });



  /**
  Given a source resume in FRESH or JRS format, a destination resume path, and a
  theme file, generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the target resume file(s).
  @param theme Friendly name of the resume theme. Defaults to "modern".
  @param logger Optional logging override.
  */
  function build( src, dst, opts ) {


    if( !src || !src.length ) { this.err( HMSTATUS.resumeNotFound ); }

    prep( src, dst, opts );

    // Load input resumes...
    var sheets = ResumeFactory.load(src, {
      format: null, objectify: true, throw: true, inner: { sort: _opts.sort }
    }, this).map( function(sh) {
      return sh.rez;
    });

    // Load the theme...we do this first because the theme choice (FRESH or
    // JSON Resume) determines what format we'll convert the resume to.
    this.stat( HMEVENT.beforeTheme, { theme: _opts.theme });
    var tFolder = verifyTheme.call( this, _opts.theme );
    var theme = loadTheme( tFolder );
    this.stat( HMEVENT.afterTheme, { theme: theme });

    // Check for invalid outputs
    var inv = verifyOutputs.call( this, dst, theme );
    if( inv && inv.length ) {
      this.err( HMSTATUS.invalidFormat, { data: inv, theme: theme } );
    }

    // Convert resume inputs as necessary
    var toFormat = theme.render ? 'JRS' : 'FRESH';
    sheets.forEach( function( sh, idx ) {
      if( sh.format() !== toFormat ) {
        this.stat( HMEVENT.beforeInlineConvert );
        sheets[ idx ] = new (RTYPES[ toFormat ])();
        var convJSON = RConverter[ 'to' + toFormat ]( sh );
        sheets[ idx ].parseJSON( convJSON );
        this.stat( HMEVENT.afterInlineConvert, { file: sh.i().file, fmt: toFormat } );
      }
    }, this);

    // Merge input resumes...
    (sheets.length > 1) && this.stat( HMEVENT.beforeMerge, { f: _.clone(sheets) });
    rez = _.reduceRight( sheets, function( a, b, idx ) {
      return extend( true, b, a );
    });
    // TODO: Fix this condition
    (sheets.length) && this.stat( HMEVENT.afterMerge, { r: rez } );

    // Expand output resumes...
    var targets = expand( dst, theme );

    // Run the transformation!
    _.each(targets, function(t) {
      t.final = single.call( this, t, theme, targets );
    }, this);

    // Don't send the client back empty-handed
    return { sheet: rez, targets: targets, processed: targets };
  }



  /**
  Prepare for a BUILD run.
  */
  function prep( src, dst, opts ) {

    // Cherry-pick options //_opts = extend( true, _opts, opts );
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim()) || 'modern';
    _opts.prettify = opts.prettify === true;
    _opts.css = opts.css || 'embed';
    _opts.pdf = opts.pdf;
    _opts.wrap = opts.wrap || 60;
    _opts.stitles = opts.sectionTitles;
    _opts.tips = opts.tips;
    _opts.noTips = opts.noTips;
    _opts.debug = opts.debug;
    _opts.sort = opts.sort;

    // If two or more files are passed to the GENERATE command and the TO
    // keyword is omitted, the last file specifies the output file.
    ( src.length > 1 && ( !dst || !dst.length ) ) && dst.push( src.pop() );

  }



  /**
  Generate a single target resume such as "out/rez.html" or "out/rez.doc".
  TODO: Refactor.
  @param targInfo Information for the target resume.
  @param theme A FRESHTheme or JRSTheme object.
  */
  function single( targInfo, theme, finished ) {

    try {
      if( !targInfo.fmt ) {
        return;
      }
      var f = targInfo.file
        , fType = targInfo.fmt.outFormat
        , fName = PATH.basename(f, '.' + fType)
        , theFormat;

      this.stat( HMEVENT.beforeGenerate, {
        fmt: targInfo.fmt.outFormat,
        file: PATH.relative(process.cwd(), f)
      });

      // If targInfo.fmt.files exists, this format is backed by a document.
      // Fluent/FRESH themes are handled here.
      if( targInfo.fmt.files && targInfo.fmt.files.length ) {
        theFormat = _fmts.filter(
          function(fmt) { return fmt.name === targInfo.fmt.outFormat; })[0];
        MKDIRP.sync( PATH.dirname( f ) ); // Ensure dest folder exists;
        _opts.targets = finished;
        return theFormat.gen.generate( rez, f, _opts );
      }

      //Otherwise this is an ad-hoc format (JSON, YML, or PNG) that every theme
      // gets "for free".
      else {

        theFormat = _fmts.filter( function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];

        var outFolder = PATH.dirname( f );
        MKDIRP.sync( outFolder ); // Ensure dest folder exists;

        return theFormat.gen.generate( rez, f, _opts );
      }
    }
    catch( ex ) {
      // Catch any errors caused by generating this file and don't let them
      // propagate -- typically we want to continue processing other formats
      // even if this format failed.
      this.err( HMEVENT.generate, { inner: ex } );
    }
  }



  /**
  Ensure that user-specified outputs/targets are valid.
  */
  function verifyOutputs( targets, theme ) {

    this.stat(HMEVENT.verifyOutputs, { targets: targets, theme: theme });

    return _.reject(
      targets.map( function( t ) {
        var pathInfo = parsePath( t );
        return {
          format: pathInfo.extname.substr(1)
        };
      }),
      function(t) {
        return t.format === 'all' || theme.hasFormat( t.format );
      }
    );

  }



  /**
  Expand output files. For example, "foo.all" should be expanded to
  ["foo.html", "foo.doc", "foo.pdf", "etc"].
  @param dst An array of output files as specified by the user.
  @param theTheme A FRESHTheme or JRSTheme object.
  */
  function expand( dst, theTheme ) {

    // Add freebie formats (JSON, YAML, PNG) every theme gets...
    // Add HTML-driven PNG only if the theme has an HTML format.
    theTheme.formats.json = theTheme.formats.json || {
      freebie: true, title: 'json', outFormat: 'json', pre: 'json',
      ext: 'json', path: null, data: null
    };
    theTheme.formats.yml = theTheme.formats.yml || {
      freebie: true, title: 'yaml', outFormat: 'yml', pre: 'yml',
      ext: 'yml', path: null, data: null
    };
    if( theTheme.formats.html && !theTheme.formats.png ) {
      theTheme.formats.png = {
        freebie: true, title: 'png', outFormat: 'png',
        ext: 'yml', path: null, data: null
      };
    }

    // Set up the destination collection. It's either the array of files passed
    // by the user or 'out/resume.all' if no targets were specified.
    var destColl = (dst && dst.length && dst) ||
                   [PATH.normalize('out/resume.all')];

    // Assemble an array of expanded target files... (can't use map() here)
    var targets = [];
    destColl.forEach( function(t) {

      var to = PATH.resolve(t), pa = parsePath(to),fmat = pa.extname || '.all';


      targets.push.apply(
        targets, fmat === '.all' ?
        Object.keys( theTheme.formats ).map( function( k ) {
          var z = theTheme.formats[k];
          return { file: to.replace( /all$/g, z.outFormat ), fmt: z };
        }) :
        [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]);

      // targets.push.apply(
      //   targets, fmat === '.all' ?
      //   Object.keys( explicitFormats ).map( function( k ) {
      //     var z = theTheme.formats[k];
      //     return { file: to.replace( /all$/g, z.outFormat ), fmt: z };
      //   }) :
      //   [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]);

    });

    return targets;
  }



  /**
  Verify the specified theme name/path.
  */
  function verifyTheme( themeNameOrPath ) {
    var tFolder = PATH.join(
      parsePath ( require.resolve('fresh-themes') ).dirname,
      '/themes/',
      themeNameOrPath
    );
    var exists = require('path-exists').sync;
    if( !exists( tFolder ) ) {
      tFolder = PATH.resolve( themeNameOrPath );
      if( !exists( tFolder ) ) {
        this.err( HMSTATUS.themeNotFound, { data: _opts.theme } );
      }
    }
    return tFolder;
  }



  /**
  Load the specified theme, which could be either a FRESH theme or a JSON Resume
  theme.
  */
  function loadTheme( tFolder ) {

    // Create a FRESH or JRS theme object
    var theTheme = _opts.theme.indexOf('jsonresume-theme-') > -1 ?
      new JRSTheme().open(tFolder) : new FluentTheme().open( tFolder );

    // Cache the theme object
    _opts.themeObj = theTheme;

    return theTheme;
  }



}());
