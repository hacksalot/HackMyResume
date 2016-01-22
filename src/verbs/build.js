/**
Implementation of the 'build' verb for HackMyResume.
@module verbs/build
@license MIT. See LICENSE.md for details.
*/



(function() {



  var _              = require('underscore')
    , PATH           = require('path')
    , FS             = require('fs')
    , MD             = require('marked')
    , MKDIRP         = require('mkdirp')
    , extend         = require('extend')
    , parsePath      = require('parse-filepath')
    , RConverter     = require('fresh-jrs-converter')
    , HMSTATUS       = require('../core/status-codes')
    , HMEVENT        = require('../core/event-codes')
    , RTYPES         = { FRESH: require('../core/fresh-resume'),
                         JRS: require('../core/jrs-resume') }
    , _opts          = require('../core/default-options')
    , FRESHTheme     = require('../core/fresh-theme')
    , JRSTheme       = require('../core/jrs-theme')
    , ResumeFactory  = require('../core/resume-factory')
    , _fmts          = require('../core/default-formats')
    , Verb           = require('../verbs/verb');

  var _err, _log, _rezObj;



  /** An invokable resume generation command. */
  var BuildVerb = module.exports = Verb.extend({

    /** Create a new build verb. */
    init: function() {
      this._super('build');
    },

    /** Invoke the Build command. */
    invoke: function() {
      this.stat( HMEVENT.begin, { cmd: 'build' } );
      var ret = build.apply( this, arguments );
      this.stat( HMEVENT.end );
      return ret;
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

    if( !src || !src.length ) {
      this.err( HMSTATUS.resumeNotFound, { quit: true } );
    }

    prep( src, dst, opts );

    // Load input resumes as JSON...
    var sheetObjects = ResumeFactory.load(src, {
      format: null, objectify: false, quit: true, inner: { sort: _opts.sort }
    }, this);

    // Explicit check for any resume loading errors...
    if( !sheetObjects ||
        _.some( sheetObjects, function(so) { return so.fluenterror; } ) ) {
      return null;
    }

    var sheets = sheetObjects.map(function(r) { return r.json; });

    // Load the theme...
    var theme;
    this.stat( HMEVENT.beforeTheme, { theme: _opts.theme });
    try {
      var tFolder = verifyTheme.call( this, _opts.theme );
      theme = _opts.themeObj = loadTheme( tFolder );
    }
    catch( ex ) {
      var newEx = {
        fluenterror: HMSTATUS.themeLoad,
        inner: ex,
        attempted: _opts.theme
      };
      this.err( HMSTATUS.themeLoad, newEx );
      return null;
    }
    this.stat( HMEVENT.afterTheme, { theme: theme });

    // Check for invalid outputs...
    var inv = verifyOutputs.call( this, dst, theme );
    if( inv && inv.length ) {
      this.err( HMSTATUS.invalidFormat, { data: inv, theme: theme } );
    }

    // Merge input resumes, yielding a single source resume.
    var rez;
    if( sheets.length > 1 ) {
      var isFRESH = !sheets[0].basics;
      var mixed = _.any( sheets, function(s) { return isFRESH ? s.basics : !s.basics; });
      this.stat( HMEVENT.beforeMerge, { f: _.clone(sheetObjects), mixed: mixed });
      if( mixed ) {
        this.err( HMSTATUS.mixedMerge );
      }
      rez = _.reduceRight( sheets, function( a, b, idx ) {
        return extend( true, b, a );
      });
      this.stat( HMEVENT.afterMerge, { r: rez } );
    }
    else {
      rez = sheets[0];
    }

    // Convert the merged source resume to the theme's format, if necessary
    var orgFormat = rez.basics ? 'JRS' : 'FRESH';
    var toFormat = theme.render ? 'JRS' : 'FRESH';
    if( toFormat !== orgFormat ) {
      this.stat( HMEVENT.beforeInlineConvert );
      rez = RConverter[ 'to' + toFormat ]( rez );
      this.stat( HMEVENT.afterInlineConvert, { file: sheetObjects[0].file, fmt: toFormat });
    }

    // Add freebie formats to the theme
    addFreebieFormats( theme  );
    this.stat( HMEVENT.applyTheme, { r: rez, theme: theme });

    // Load the resume into a FRESHResume or JRSResume object
    _rezObj = new (RTYPES[ toFormat ])().parseJSON( rez );

    // Expand output resumes...
    var targets = expand( dst, theme );

    // Run the transformation!
    _.each(targets, function(t) {
      t.final = single.call( this, t, theme, targets );
    }, this);

    // Don't send the client back empty-handed
    return { sheet: _rezObj, targets: targets, processed: targets };
  }



  /**
  Prepare for a BUILD run.
  */
  function prep( src, dst, opts ) {

    // Cherry-pick options //_opts = extend( true, _opts, opts );
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim()) || 'modern';
    _opts.prettify = opts.prettify === true;
    _opts.css = opts.css;
    _opts.pdf = opts.pdf;
    _opts.wrap = opts.wrap || 60;
    _opts.stitles = opts.sectionTitles;
    _opts.tips = opts.tips;
    _opts.errHandler = opts.errHandler;
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

    var ret, ex, f = targInfo.file;

    try {

      if( !targInfo.fmt ) {  return; }
      var fType = targInfo.fmt.outFormat
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
        ret = theFormat.gen.generate( _rezObj, f, _opts );
      }
      //Otherwise this is an ad-hoc format (JSON, YML, or PNG) that every theme
      // gets "for free".
      else {
        theFormat = _fmts.filter( function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];
        var outFolder = PATH.dirname( f );
        MKDIRP.sync( outFolder ); // Ensure dest folder exists;
        ret = theFormat.gen.generate( _rezObj, f, _opts );
      }
    }
    catch( e ) {
      // Catch any errors caused by generating this file and don't let them
      // propagate -- typically we want to continue processing other formats
      // even if this format failed.
      ex = e;
    }

    this.stat( HMEVENT.afterGenerate, {
      fmt: targInfo.fmt.outFormat,
      file: PATH.relative( process.cwd(), f ),
      error: ex
    });

    if( ex ) {
      if( ex.fluenterror )
        this.err( ex.fluenterror, ex );
      else
        this.err( HMSTATUS.generateError, { inner: ex } );
    }

    return ret;
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
  Reinforce the chosen theme with "freebie" formats provided by HackMyResume.
  A "freebie" format is an output format such as JSON, YML, or PNG that can be
  generated directly from the resume model or from one of the theme's declared
  output formats. For example, the PNG format can be generated for any theme
  that declares an HTML format; the theme doesn't have to provide an explicit
  PNG template.
  @param theTheme A FRESHTheme or JRSTheme object.
  */
  function addFreebieFormats( theTheme ) {
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
  }



  /**
  Expand output files. For example, "foo.all" should be expanded to
  ["foo.html", "foo.doc", "foo.pdf", "etc"].
  @param dst An array of output files as specified by the user.
  @param theTheme A FRESHTheme or JRSTheme object.
  */
  function expand( dst, theTheme ) {

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
      new JRSTheme().open(tFolder) : new FRESHTheme().open( tFolder );

    // Cache the theme object
    _opts.themeObj = theTheme;

    return theTheme;
  }



}());
