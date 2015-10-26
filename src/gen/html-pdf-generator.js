/**
HTML-based PDF resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

var TemplateGenerator = require('./template-generator');
var FS = require('fs-extra');
var HTML = require( 'html' );

var HtmlPdfGenerator = module.exports = TemplateGenerator.extend({

  init: function() {
    this._super( 'pdf', 'html' );
  },

  /**
  Generate an HTML resume with optional pretty printing.
  TODO: Avoid copying the CSS file to dest if we don't need to.
  */
  onBeforeSave: function( mk, themeFile, outputFile ) {
    // var cssSrc = themeFile.replace( /pdf\.html$/gi, 'html.css' );
    // var cssDst = outputFile.replace( /\.pdf$/gi, '.css' );
    // var that = this;
    // FS.copySync( cssSrc, cssDst, { clobber: true }, function( e ) {
    //   if( e ) that.err( "Couldn't copy CSS file to destination: " + e);
    // });
    // return true ?
    //   HTML.prettyPrint( mk, { indent_size: 2 } ) : mk;

    pdf(mk, outputFile);
    return mk;
  }

});

/**
Generate a PDF from HTML.
*/
function pdf( markup, fOut ) {

  var pdfCount = 0;
  if( false ) { //( _opts.pdf === 'phantom' || _opts.pdf == 'all' ) {
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
  if( true ) { // _opts.pdf === 'wkhtmltopdf' || _opts.pdf == 'all' ) {
    var fOut2 = fOut;
    if( pdfCount == 1 ) {
      fOut2 = fOut2.replace(/\.pdf$/g, '.b.pdf');
    }
    require('wkhtmltopdf')( markup, { pageSize: 'letter' } )
      .pipe( FS.createWriteStream( fOut2 ) );
      pdfCount++;
  }
}
