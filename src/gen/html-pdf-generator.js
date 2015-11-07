/**
Definition of the HtmlPdfGenerator class.
@license Copyright (c) 2015 James M. Devlin / FluentDesk
*/

(function() {

  var TemplateGenerator = require('./template-generator')
    , FS = require('fs-extra')
    , HTML = require( 'html' );

  /**
  An HTML-based PDF resume generator for FluentCV.
  */
  var HtmlPdfGenerator = module.exports = TemplateGenerator.extend({

    init: function() {
      this._super( 'pdf', 'html' );
    },

    /**
    Generate the binary PDF.
    */
    onBeforeSave: function( info ) {
      pdf(info.mk, info.outputFile);
      return info.mk;
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

}());
