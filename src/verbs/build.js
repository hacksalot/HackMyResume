/**
Implementation of the 'generate' verb for HackMyResume.
@module generate.js
@license MIT. See LICENSE.md for details.
*/
// TODO: EventEmitter


(function() {



  var PATH = require('path')
    , FS = require('fs')
    , MD = require('marked')
    , MKDIRP = require('mkdirp')
    , EXTEND = require('../utils/extend')
    , HACKMYSTATUS = require('../core/status-codes')
    , parsePath = require('parse-filepath')
    , _opts = require('../core/default-options')
    , FluentTheme = require('../core/fresh-theme')
    , JRSTheme = require('../core/jrs-theme')
    , ResumeFactory = require('../core/resume-factory')
    , _ = require('underscore')
    , _fmts = require('../core/default-formats')
    , extend = require('../utils/extend')
    , chalk = require('chalk')
    , pad = require('string-padding')
    , _err, _log, rez;



  /**
  Handle an exception.
  */
  function error( ex ) {
    throw ex;
  }



  /**
  Given a source resume in FRESH or JRS format, a destination resume path, and a
  theme file, generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the target resume file(s).
  @param theme Friendly name of the resume theme. Defaults to "modern".
  @param logger Optional logging override.
  */
  function build( src, dst, opts, logger, errHandler ) {

    prep( src, dst, opts, logger, errHandler );

    // Load the theme...we do this first because the theme choice (FRESH or
    // JSON Resume) determines what format we'll convert the resume to.
    var tFolder = verify_theme( _opts.theme );
    var theme = load_theme( tFolder );

    // Check for invalid outputs
    var inv = verify_outputs( dst, theme );
    if( inv && inv.length ) {
      throw { fluenterror: HACKMYSTATUS.invalidTarget, data: inv, theme: theme };
    }

    // Load input resumes...
    if( !src || !src.length ) { throw { fluenterror: 3 }; }
    var sheets = ResumeFactory.load(src, {
      log: _log, format: theme.render ? 'JRS' : 'FRESH',
      objectify: true, throw: true
    }).map(function(sh){ return sh.rez; });

    // Merge input resumes...
    var msg = '';
    rez = _.reduceRight( sheets, function( a, b, idx ) {
      msg += ((idx == sheets.length - 2) ?
        chalk.cyan('Merging ') + chalk.cyan.bold(a.i().file) : '') +
        chalk.cyan(' onto ') + chalk.cyan.bold(b.i().file);
      return extend( true, b, a );
    });
    msg && _log(msg);

    // Output theme messages
    var numFormats = Object.keys(theme.formats).length;
    var themeName = theme.name.toUpperCase();
    _log( chalk.yellow('Applying ') + chalk.yellow.bold(themeName) +
      chalk.yellow(' theme (' + numFormats + ' format' +
        ( numFormats === 1 ? ')' : 's)') ));

    // Expand output resumes...
    var targets = expand( dst, theme );

    // Run the transformation!
    targets.forEach( function(t) {
      t.final = single( t, theme, targets );
    });

    if( _opts.tips && (theme.message || theme.render) ) {
      var WRAP = require('word-wrap');
      if( theme.message ) {
        _log( WRAP( chalk.gray('The ' + themeName +
          ' theme says: "') + chalk.white(theme.message) + chalk.gray('"'),
          { width: _opts.wrap, indent: '' } ));
      }
      else {
        _log( WRAP( chalk.gray('The ' + themeName +
          ' theme says: "') + chalk.white('For best results view JSON Resume ' +
          'themes over a local or remote HTTP connection. For example:'),
          { width: _opts.wrap, indent: '' }
        ));
        _log('');
        _log(
          '    npm install http-server -g\r' +
          '    http-server <resume-folder>' );
        _log('');
        _log(chalk.white('For more information, see the README."'),
          { width: _opts.wrap, indent: '' } );
      }
    }


    // Don't send the client back empty-handed
    return { sheet: rez, targets: targets, processed: targets };
  }



  /**
  Prepare for a BUILD run.
  */
  function prep( src, dst, opts, logger, errHandler ) {

    // Housekeeping
    _log = logger || console.log;
    _err = errHandler || error;

    //_opts = extend( true, _opts, opts );
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim()) || 'modern';
    _opts.prettify = opts.prettify === true;
    _opts.css = opts.css || 'embed';
    _opts.pdf = opts.pdf;
    _opts.wrap = opts.wrap || 60;
    _opts.stitles = opts.sectionTitles;
    _opts.tips = opts.tips;
    _opts.noTips = opts.noTips;

    // If two or more files are passed to the GENERATE command and the TO
    // keyword is omitted, the last file specifies the output file.
    ( src.length > 1 && ( !dst || !dst.length ) ) && dst.push( src.pop() );

  }



  /**
  Generate a single target resume such as "out/rez.html" or "out/rez.doc".
  @param targInfo Information for the target resume.
  @param theme A FRESHTheme or JRSTheme object.
  @returns
  */
  function single( targInfo, theme, finished ) {

    function MDIN(txt) { // TODO: Move this
      return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
    }

    try {
      if( !targInfo.fmt ) {
        return;
      }
      var f = targInfo.file
        , fType = targInfo.fmt.outFormat
        , fName = PATH.basename(f, '.' + fType)
        , theFormat;

        var suffix = '';
        if( targInfo.fmt.outFormat === 'pdf' ) {
          if( _opts.pdf ) {
            if( _opts.pdf !== 'none' ) {
              suffix = chalk.green(' (with ' + _opts.pdf + ')');
            }
            else {
              _log( chalk.gray('Skipping   ') +
                chalk.white.bold(
                  pad(targInfo.fmt.outFormat.toUpperCase(),4,null,pad.RIGHT)) +
                chalk.gray(' resume') + suffix + chalk.green(': ') +
                chalk.white( PATH.relative(process.cwd(), f )) );
              return;
            }
          }
        }

        _log( chalk.green('Generating ') +
          chalk.green.bold(
            pad(targInfo.fmt.outFormat.toUpperCase(),4,null,pad.RIGHT)) +
          chalk.green(' resume') + suffix + chalk.green(': ') +
          chalk.green.bold( PATH.relative(process.cwd(), f )) );

      // If targInfo.fmt.files exists, this format is backed by a document.
      // Fluent/FRESH themes are handled here.
      if( targInfo.fmt.files && targInfo.fmt.files.length ) {
          theFormat = _fmts.filter(
            function(fmt) { return fmt.name === targInfo.fmt.outFormat; })[0];
          MKDIRP.sync( PATH.dirname( f ) ); // Ensure dest folder exists;
          _opts.targets = finished;
          return theFormat.gen.generate( rez, f, _opts );
      }

      // Otherwise this is either a) a JSON Resume theme or b) an ad-hoc format
      // (JSON, YML, or PNG) that every theme gets "for free".
      else {

        theFormat = _fmts.filter( function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];

        var outFolder = PATH.dirname( f );
        MKDIRP.sync( outFolder ); // Ensure dest folder exists;

        // JSON Resume themes have a 'render' method that needs to be called
        if( theme.render ) {
          var COPY = require('copy');
          var globs = [ '*.css', '*.js', '*.png', '*.jpg', '*.gif', '*.bmp' ];
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
          rezHtml = rezHtml.replace( /@@@@~.*?~@@@@/gm, function(val){
            return MDIN( val.replace( /~@@@@/gm,'' ).replace( /@@@@~/gm,'' ) );
          });

          // Save the file
          FS.writeFileSync( f, rezHtml );

          // Return markup to the client
          return rezHtml;
        }
        else {
          return theFormat.gen.generate( rez, f, _opts );
        }
      }
    }
    catch( ex ) {
      _err( ex );
    }
  }



  /**
  Ensure that user-specified outputs/targets are valid.
  */
  function verify_outputs( targets, theme ) {

    return _.reject(
      targets.map( function( t ) {
        var pathInfo = parsePath( t );
        return {
          format: pathInfo.extname.substr(1)
        };
      }),
      function(t) {
        return t.format === 'all' || theme.hasFormat( parsePath( t.format ).extname.substr(1));
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
  function verify_theme( themeNameOrPath ) {
    var tFolder = PATH.join(
      parsePath ( require.resolve('fresh-themes') ).dirname,
      '/themes/',
      themeNameOrPath
    );
    var exists = require('path-exists').sync;
    if( !exists( tFolder ) ) {
      tFolder = PATH.resolve( themeNameOrPath );
      if( !exists( tFolder ) ) {
        throw { fluenterror: 1, data: _opts.theme };
      }
    }
    return tFolder;
  }



  /**
  Load the specified theme.
  */
  function load_theme( tFolder ) {

    // Create a FRESH or JRS theme object
    var theTheme = _opts.theme.indexOf('jsonresume-theme-') > -1 ?
      new JRSTheme().open(tFolder) : new FluentTheme().open( tFolder );

    // Cache the theme object
    _opts.themeObj = theTheme;

    return theTheme;
  }



  module.exports = build;



}());
