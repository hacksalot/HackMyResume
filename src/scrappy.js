/**
Core resume generation module for Scrappy.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

module.exports = function () {

  var MD   = require( 'marked' )
    , XML  = require( 'xml-escape' )
    , HTML = require( 'html' )
    , FS   = require( 'fs-extra' )
    , XML  = require( 'xml-escape' )
    , path = require( 'path' )
    , extend = require( './extend' )
    , _ = require('underscore');

  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  var rez;

  /**
  Core resume generation method for HMR. Given a source JSON resume file, a
  destination resume spec, and a theme file, generate 0..N resumes in the
  requested formats. Requires filesystem access. To perform generation without
  filesystem access, use the single() method below.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst Path to the destination resume file(s): "rez/resume.all".
  @param theme Friendly name of the resume theme. Defaults to "default".
  */
  function hmr( src, dst, theme ) {

    _opts.theme = theme;
    dst = (dst && dst.length && dst) || ['resume.all'];

    // Assemble output resume targets
    var targets = [];
    dst.forEach( function(t) {
      var dot = t.lastIndexOf('.');
      var format = ( dot === -1 ) ? 'all' : t.substring( dot + 1 );
      var temp = ( format === 'all' ) ?
        _fmts.map( function( fmt ) { return t.replace( /all$/g, fmt.name ); }) :
        ( format === 'doc' ? [ 'doc' ] : [ t ] ); // interim code
      targets.push.apply(targets, temp);
    });

    // Assemble input resumes
    var sheets = src.map( function( res ) {
      console.log( 'Reading JSON resume: ' + res );
      var raw = FS.readFileSync( res, 'utf8' );
      return JSON.parse( raw );
    });

    // Merge input resumes
    rez = sheets.reduce( function( acc, elem ) {
      return extend(true, acc, elem);
    });

    // Run the transformation!
    targets.map( gen );
  }

  /**
  Generate a single resume of a specific format.
  */
  function gen( f ) {
    try {

      // Load the theme template
      var fName = f.substring( f.lastIndexOf('.') + 1 );
      var fObj = _fmts.filter( function(_f) { return _f.name === fName; } )[0];
      var fOut = path.join( f.substring( 0, f.lastIndexOf('.') + 1 ) + fObj.ext );
      console.log( 'Generating ' + fName.toUpperCase() + ' resume: ' + fOut );
      var themeFile = path.join( __dirname, '../../blueprint/', _opts.theme,
        fName + '.' + (fObj.fmt || fObj.ext));
      var cssData = (fName != 'html' && fName != 'pdf') ? null :
        FS.readFileSync( path.join( __dirname, '../../blueprint/', _opts.theme, 'html.css' ), 'utf8' );
      var mk = FS.readFileSync( themeFile, 'utf8' );

      // Compile and invoke the template
      mk = single( rez, mk, fName, cssData );

      // Post-process and save the file
      fName === 'html' && (mk = html( mk, themeFile, fOut ));
      fName === 'pdf' && pdf( mk, fOut );
      fName !== 'pdf' && FS.writeFileSync( fOut, mk, 'utf8' );
    }
    catch( ex ) {
      err( ex );
    }
  }

  /**
  Perform a single resume JSON-to-DEST resume transformation. Exists as a
  separate function in order to expose string-based transformations to clients
  who don't have access to filesystem resources (in-browser, etc.).
  */
  function single( json, jst, format, styles ) {

    // Freeze whitespace in the template
    _opts.keepBreaks && ( jst = freeze(jst) );

    // Tweak underscore's default template delimeters
    _.templateSettings = _opts.template;

    // Convert {{ someVar }} to {% print(filt.out(someVar) %}
    // Convert {{ someVar|someFilter }} to {% print(filt.someFilter(someVar) %}
    jst = jst.replace( _.templateSettings.interpolate, function replace(m, p1) {
      if( p1.indexOf('|') > -1 ) {
        var terms = p1.split('|');
        return '{% print( filt.' + terms[1] + '( ' + terms[0] + ' )) %}';
      }
      else {
        return '{% print( filt.out(' + p1 + ') ) %}';
      }
    });

    // Strip {# comments #}
    jst = jst.replace( _.templateSettings.comment, '');
    json.display_progress_bar = true;

    // Compile and run the template. TODO: avoid unnecessary recompiles.
    jst = _.template( jst )({ r: json, css: styles, embedCss: false, filt: _opts.filters });

    // Unfreeze whitespace
    _opts.keepBreaks && ( jst = unfreeze(jst) );

    return jst;
  }

  /**
  Handle an exception.
  */
  function err( ex ) {
    var msg = ex.toString();
    var idx = msg.indexOf('Error: ');
    var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
    console.error( 'ERROR: ' + trimmed.toString() );
  }

  /**
  Generate an HTML resume with optional pretty printing.
  */
  function html( mk, themeFile, outputFile ) {
    var cssSrc = themeFile.replace( /.html$/g, '.css' );
    var cssDst = outputFile.replace( /.html$/g, '.css' );
    FS.copy( cssSrc, cssDst, function( e ) {
      if( e ) err( "Couldn't copy CSS file to destination: " + err);
    });
    return _opts.prettyPrint ? // TODO: copy CSS
      HTML.prettyPrint( mk, { indent_size: _opts.prettyIndent } ) : mk;
  }

  /**
  Generate a PDF from HTML.
  */
  function pdf( markup, fOut ) {

    var pdfCount = 0;
    if( _opts.pdf === 'phantom' || _opts.pdf == 'all' ) {
      pdfCount++;
      require('phantom').create( function( ph ) {
        ph.createPage( function( page ) {
          page.setContent( markup );
          page.set('paperSize', {
            format: 'A4',
            orientation: 'portrait',
            margin: '1cm'
          });
          page.set("viewportSize", {
            width: 1024, // TODO: option-ify
            height: 768 // TODO: Use "A" sizes
          });
          page.set('onLoadFinished', function(success) {
            page.render( fOut );
            pdfCount++;
            ph.exit();
          });
        },
        { dnodeOpts: {  weak: false   } } );
      });
    }
    if( _opts.pdf === 'wkhtmltopdf' || _opts.pdf == 'all' ) {
      var fOut2 = fOut;
      if( pdfCount == 1 ) {
        fOut2 = fOut2.replace(/\.pdf$/g, '.b.pdf');
      }
      require('wkhtmltopdf')( markup, { pageSize: 'letter' } )
        .pipe( FS.createWriteStream( fOut2 ) );
        pdfCount++;
    }
  }

  /**
  Freeze newlines for protection against errant JST parsers.
  */
  function freeze( markup ) {
    return markup
      .replace( _reg.regN, _opts.nSym )
      .replace( _reg.regR, _opts.rSym );
  }

  /**
  Unfreeze newlines when the coast is clear.
  */
  function unfreeze( markup ) {
    return markup
      .replace( _reg.regSymR, '\r' )
      .replace( _reg.regSymN, '\n' );
  }

  /**
  Supported resume formats.
  */
  var _fmts = [
    { name: 'html', ext: 'html' },
    { name: 'txt',  ext: 'txt'  },
    { name: 'doc',  ext: 'doc',  fmt: 'xml' },
    { name: 'pdf',  ext: 'pdf', fmt: 'html', is: false }
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
    pdf: 'all'
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
    transform: single,
    options: _opts,
    formats: _fmts
  };

}();
