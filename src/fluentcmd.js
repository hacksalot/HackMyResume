/**
Core resume generation module for FluentCMD.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

module.exports = function () {

  var MD   = require( 'marked' )
    , XML  = require( 'xml-escape' )
    , HTML = require( 'html' )
    , FS   = require( 'fs-extra' )
    , XML  = require( 'xml-escape' )
    , path = require( 'path' )
    , extend = require( './utils/extend' )
    , _ = require('underscore')
    , unused = require('./utils/string')
    , FLUENT = require('fluentlib');

  var rez, _log;

  /**
  Core resume generation method for HMR. Given a source JSON resume file, a
  destination resume spec, and a theme file, generate 0..N resumes in the
  requested formats. Requires filesystem access. To perform generation without
  filesystem access, use the single() method below.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst Path to the destination resume file(s): "rez/resume.all".
  @param theme Friendly name of the resume theme. Defaults to "default".
  */
  function hmr( src, dst, theme, logger ) {

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
    var finished = targets.map( gen );

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
  function gen( f ) {
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
  Default options.
  */
  var _opts = {
    prettyPrint: true,
    prettyIndent: 2,
    keepBreaks: true,
    nSym: '&newl;',
    rSym: '&retn;',
    theme: 'default',
    sheets: [],
    filters: {
      out: function( txt ) { return txt; },
      raw: function( txt ) { return txt; },
      xml: function( txt ) { return XML(txt); },
      md: function( txt ) { return MD(txt); },
      mdin: function( txt ) { return MD(txt).replace(/^\s*\<p\>|\<\/p\>\s*$/gi, ''); },
      lower: function( txt ) { return txt.toLowerCase(); }
    },
    template: {
      interpolate: /\{\{(.+?)\}\}/g,
      escape: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\%(.+?)\%\}/g,
      comment: /\{\#(.+?)\#\}/g
    },
    pdf: 'wkhtmltopdf'
  }

  /**
  Regexes for linebreak preservation.
  */
  var _reg = {
    regN: new RegExp( '\n', 'g' ),
    regR: new RegExp( '\r', 'g' ),
    regSymN: new RegExp( _opts.nSym, 'g' ),
    regSymR: new RegExp( _opts.rSym, 'g' )
  };

  /**
  Module public interface.
  */
  return {
    generate: hmr,
    options: _opts,
    formats: _fmts
  };

}();
