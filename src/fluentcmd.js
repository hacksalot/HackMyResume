/**
Internal resume generation logic for FluentCMD.
@license Copyright (c) 2015 | James M. Devlin
*/

module.exports = function () {

  // We don't mind pseudo-globals here
  var MD   = require( 'marked' )
    , XML  = require( 'xml-escape' )
    , HTML = require( 'html' )
    , FS   = require( 'fs-extra' )
    , XML  = require( 'xml-escape' )
    , path = require( 'path' )
    , extend = require( './utils/extend' )
    , _ = require('underscore')
    , unused = require('./utils/string')
    , FLUENT = require('fluentlib')
    , rez
    , _log;

  /**
  Core workhorse method for FluentCMD. Given a source JSON resume, a destination
  resume path, and a theme file, generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the destination resume file(s): "rez/resume.all".
  @param theme Friendly name of the resume theme. Defaults to "default".
  @param logger Optional logging override.
  */
  function gen( src, dst, theme, logger ) {

    _log = logger || console.log;
    _opts.theme = theme;
    dst = (dst && dst.length && dst) || ['resume.all'];

    // Assemble output resume targets
    var targets = [];
    dst.forEach( function(t) {
      t = path.resolve(t);
      var dot = t.lastIndexOf('.');
      var format = ( dot === -1 ) ? 'all' : t.substring( dot + 1 );
      var temp = ( format === 'all' ) ?
        _fmts.map( function( fmt ) { return t.replace( /all$/g, fmt.name ); }) :
        ( format === 'doc' ? [ 'doc' ] : [ t ] ); // interim code
      targets.push.apply(targets, temp);
    });

    // Assemble input resumes
    var sheets = src.map( function( res ) {
      _log( 'Reading JSON resume: ' + res );
      return (new FLUENT.Sheet()).open( res );
    });

    // Merge input resumes
    rez = sheets.reduce( function( acc, elem ) {
      return extend( true, acc.rep, elem.rep );
    });

    // Run the transformation!
    var finished = targets.map( single );

    return {
      sheet: rez,//.rep,
      targets: targets,
      processed: finished
    };
  }

  /**
  Generate a single resume of a specific format.
  @param f Full path to the destination resume to generate, for example,
  "/foo/bar/resume.pdf" or "c:\foo\bar\resume.txt".
  */
  function single( f ) {
    try {

      // Get the output file type (pdf, html, txt, etc)
      var fType = path.extname( f ).trim().toLowerCase().substr(1);
      var fName = path.basename( f, '.' + fType );

      // Get the format object (if any) corresponding to that type, and assemble
      // the final output file path for the generated resume.
      var fObj = _fmts.filter( function(_f) { return _f.name === fType; } )[0];
      var fOut = path.join( f.substring( 0, f.lastIndexOf('.') + 1 ) + fObj.ext );

      // Generate!
      _log( 'Generating ' + fType.toUpperCase() + ' resume: ' + path.relative(process.cwd(), f) );
      return fObj.gen.generate( rez, fOut, _opts.theme );
    }
    catch( ex ) {
      err( ex );
    }
  }

  /**
  Handle an exception.
  */
  function err( ex ) {
    var msg = ex.toString();
    var idx = msg.indexOf('Error: ');
    var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
    _log( 'ERROR: ' + trimmed.toString() );
  }

  /**
  Supported resume formats.
  */
  var _fmts = [
    { name: 'html', ext: 'html', gen: new FLUENT.HtmlGenerator() },
    { name: 'txt',  ext: 'txt', gen: new FLUENT.TextGenerator()  },
    { name: 'doc',  ext: 'doc',  fmt: 'xml', gen: new FLUENT.WordGenerator() },
    { name: 'pdf',  ext: 'pdf', fmt: 'html', is: false, gen: new FLUENT.HtmlPdfGenerator() }
  ];

  /**
  Default options. TODO: Some of these are no longer necessary.
  */
  var _opts = {
    theme: 'default',
  }

  /**
  Module public interface. Used by FCV Desktop.
  */
  return {
    generate: gen,
    options: _opts,
    formats: _fmts
  };

}();
