/**
Definition of the HtmlPdfGenerator class.
@module html-pdf-generator.js
@license MIT. See LICENSE.md for details.
*/

(function() {

  var TemplateGenerator = require('./template-generator')
    , FS = require('fs-extra')
    , HTML = require( 'html' );

  /**
  An HTML-driven PDF resume generator for HackMyResume.
  */
  var HtmlPdfGenerator = module.exports = TemplateGenerator.extend({

    init: function() {
      this._super( 'pdf', 'html' );
    },

    /**
    Generate the binary PDF.
    */
    onBeforeSave: function( info ) {
      engines[ info.opts.pdf || 'wkhtmltopdf' ]
      .call( this, info.mk, info.outputFile );
      return null; // halt further processing
    }

  });


  var engines = {
    /**
    Generate a PDF from HTML using wkhtmltopdf.
    */
    wkhtmltopdf: function(markup, fOut) {
      var wk;
      try {
        wk = require('wkhtmltopdf');
        wk( markup, { pageSize: 'letter' } )
          .pipe( FS.createWriteStream( fOut ) );
      }
      catch(ex) {
        // { [Error: write EPIPE] code: 'EPIPE', errno: 'EPIPE', ... }
        // { [Error: ENOENT] }
        throw { fluenterror: this.codes.wkhtmltopdf, inner: ex };
      }
    },

    /**
    Generate a PDF from HTML using Phantom.
    */
    phantom: function( markup, fOut ) {
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
            ph.exit();
          });
        },
        { dnodeOpts: {  weak: false   } } );
      });
    }

  };



}());
