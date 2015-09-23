/**
HTML-based PDF resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

var TemplateGenerator = require('./template-generator');
var FS = require('fs-extra');
var HTML = require( 'html' );

var HtmlPdfGenerator = TemplateGenerator.extend({

  init: function() {
    this._super( 'pdf', 'html' );
  },

  /**
  Generate an HTML resume with optional pretty printing.
  */
  onBeforeSave: function( mk, themeFile, outputFile ) {
    var cssSrc = themeFile.replace( /.html$/g, '.css' );
    var cssDst = outputFile.replace( /.html$/g, '.css' );
    FS.copy( cssSrc, cssDst, function( e ) {
      if( e ) err( "Couldn't copy CSS file to destination: " + err);
    });
    return true ?
      HTML.prettyPrint( mk, { indent_size: 2 } ) : mk;
  }

});

module.exports = HtmlPdfGenerator;
