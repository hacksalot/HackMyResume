/**
Definition of the HtmlPdfGenerator class.
@module html-pdf-generator.js
*/

(function() {

  var TemplateGenerator = require('./template-generator')
    , FS = require('fs-extra')
    , HTML = require( 'html' );

  /**
  An HTML-based PDF resume generator for HackMyResume.
  */
  var HtmlPdfGenerator = module.exports = TemplateGenerator.extend({

    init: function() {
      this._super( 'pdf', 'html' );
    },

    /**
    Generate the binary PDF.
    */
    onBeforeSave: function( info ) {
      pdf.call( this, info.mk, info.outputFile );
      return null; // halt further processing
    }

  });

  /**
  Generate a PDF from HTML.
  */
  function pdf( markup, fOut ) {

    pdf_wkhtmltopdf.call( this, markup, fOut );

  }

  /**
  Generate a PDF from HTML using wkhtmltopdf.
  */
  function pdf_wkhtmltopdf( markup, fOut ) {
    var wk;
    try {
      wk = require('wkhtmltopdf');
      wk( markup, { pageSize: 'letter' } )
        .pipe( FS.createWriteStream( fOut ) );
    }
    catch(ex) {
      // { [Error: write EPIPE] code: 'EPIPE', errno: 'EPIPE', syscall: 'write' }
      // { [Error: ENOENT] }
      throw { fluenterror: this.codes.wkhtmltopdf };
    }
  }


  // function pdf_phantom() {
  //   pdfCount++;
  //   require('phantom').create( function( ph ) {
  //     ph.createPage( function( page ) {
  //       page.setContent( markup );
  //       page.set('paperSize', {
  //         format: 'A4',
  //         orientation: 'portrait',
  //         margin: '1cm'
  //       });
  //       page.set("viewportSize", {
  //         width: 1024, // TODO: option-ify
  //         height: 768 // TODO: Use "A" sizes
  //       });
  //       page.set('onLoadFinished', function(success) {
  //         page.render( fOut );
  //         pdfCount++;
  //         ph.exit();
  //       });
  //     },
  //     { dnodeOpts: {  weak: false   } } );
  //   });
  // }

}());
