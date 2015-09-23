/**
Template-based resume generator base for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {

  var FS = require( 'fs' );
  var BaseGenerator = require( './base-generator' );
  var _ = require( 'underscore' );
  var MD = require( 'marked' );
  var XML = require( 'xml-escape' );
  var path = require('path');

  var _opts = {
    keepBreaks: true,
    nSym: '&newl;',
    rSym: '&retn;',
    template: {
      interpolate: /\{\{(.+?)\}\}/g,
      escape: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\%(.+?)\%\}/g,
      comment: /\{\#(.+?)\#\}/g
    },
    filters: {
      out: function( txt ) { return txt; },
      raw: function( txt ) { return txt; },
      xml: function( txt ) { return XML(txt); },
      md: function( txt ) { return MD(txt); },
      mdin: function( txt ) { return MD(txt).replace(/^\s*\<p\>|\<\/p\>\s*$/gi, ''); },
      lower: function( txt ) { return txt.toLowerCase(); }
    },
    prettyPrint: true,
    prettyIndent: 2
  };

  /**
  TemplateGenerator performs resume generation via Underscore-style template
  expansion and is appropriate for text-based formats like HTML, plain text,
  and XML versions of Microsoft Word, Excel, and OpenOffice.
  */
  var TemplateGenerator = BaseGenerator.extend({

    /** outputFormat: html, txt, pdf, doc
        templateFormat: html or txt
    **/
    init: function( outputFormat, templateFormat, cssFile ){
      this._super( outputFormat );
      this.tplFormat = templateFormat || outputFormat;
    },

    /** Default generation method for template-based generators. */
    generate: function( rez, f, themeName ) {
      try {

        // Get the output file type (pdf, html, txt, etc)
        var fName = path.basename( f, '.' + this.format );

        // Load the active theme file, including CSS data if req'd
        var themeFile = path.join( __dirname, '../../../watermark/', themeName, this.format + '.' + this.tplFormat );
        var cssData = this.tplFormat === 'html' ? FS.readFileSync( path.join( __dirname, '../../../watermark/', themeName, 'html.css' ), 'utf8' ) : null;
        var mk = FS.readFileSync( themeFile, 'utf8' );

        // Compile and invoke the template!
        mk = this.single( rez, mk, this.format, cssData, fName );
        this.onBeforeSave && (mk = this.onBeforeSave( mk, themeFile, f ));

        // Post-process and save the file
        FS.writeFileSync( f, mk, 'utf8' );
        return mk;
      }
      catch( ex ) {
        err( ex );
      }
    },

    /**
    Perform a single resume JSON-to-DEST resume transformation. Exists as a
    separate function in order to expose string-based transformations to clients
    who don't have access to filesystem resources (in-browser, etc.).
    */
    single: function( json, jst, format, styles, fName ) {

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
      jst = _.template( jst )({ r: json, css: styles, embedCss: false, cssFile: fName, filt: _opts.filters });

      // Unfreeze whitespace
      _opts.keepBreaks && ( jst = unfreeze(jst) );

      return jst;
    }


  });

  /**
  Export the TemplateGenerator function/ctor.
  */
  module.exports = TemplateGenerator;

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
  Regexes for linebreak preservation.
  */
  var _reg = {
    regN: new RegExp( '\n', 'g' ),
    regR: new RegExp( '\r', 'g' ),
    regSymN: new RegExp( _opts.nSym, 'g' ),
    regSymR: new RegExp( _opts.rSym, 'g' )
  };



}());
