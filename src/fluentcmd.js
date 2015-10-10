/**
Internal resume generation logic for FluentCMD.
@license Copyright (c) 2015 | James M. Devlin
*/

module.exports = function () {

  // We don't mind pseudo-globals here
  var path = require( 'path' )
    , extend = require( './utils/extend' )
    , unused = require('./utils/string')
    , fs = require('fs')
    , _ = require('underscore')
    , FLUENT = require('fluentlib')
    , rez, _log, _err;

  /**
  Given a source JSON resume, a destination resume path, and a theme file,
  generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the target resume file(s).
  @param theme Friendly name of the resume theme. Defaults to "modern".
  @param logger Optional logging override.
  */
  function gen( src, dst, theme, logger, errHandler ) {

    _log = logger || console.log;
    _err = errHandler || error;
    _opts.theme = (theme && theme.toLowerCase().trim()) || 'modern';

    // Load input resumes...
    if(!src || !src.length) { throw { fluenterror: 3 }; }
    var sheets = src.map( function( res ) {
      _log( 'Reading JSON resume: ' + res );
      return (new FLUENT.Sheet()).open( res );
    });

    // Merge input resumes...
    var msg = '';
    rez = _.reduceRight( sheets, function( a, b, idx ) {
      msg += ((idx == sheets.length - 2) ? 'Merging ' + a.meta.fileName : '')
        + ' onto ' + b.meta.fileName;
      return extend( true, b, a );
    });
    msg && _log(msg);

    // Expand output resumes... (can't use map() here)
    var targets = [];
    ( (dst && dst.length && dst) || ['resume.all'] ).forEach( function(t) {
      var to = path.resolve(t), pa = path.parse(to), fmat = pa.ext || '.all';
      targets.push.apply(targets, fmat === '.all' ?
        _fmts.map(function(z){ return to.replace(/all$/g,z.name); }) : [to]);
    });

    // Run the transformation!
    var finished = targets.map( single );

    // Don't send the client back empty-handed
    return { sheet: rez, targets: targets, processed: finished };
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
    theme: 'modern',
  }

  /**
  Internal module interface. Used by FCV Desktop and HMR.
  */
  return {
    generate: gen,
    options: _opts,
    formats: _fmts
  };

}();
