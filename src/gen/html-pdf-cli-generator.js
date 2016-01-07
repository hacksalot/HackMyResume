/**
Definition of the HtmlPdfCLIGenerator class.
@module html-pdf-generator.js
@license MIT. See LICENSE.md for details.
*/



(function() {



  var TemplateGenerator = require('./template-generator')
    , FS = require('fs-extra')
    , HTML = require( 'html' )
    , PATH = require('path')
    , SLASH = require('slash');



  /**
  An HTML-driven PDF resume generator for HackMyResume. Talks to Phantom,
  wkhtmltopdf, and other PDF libraries over a CLI.
  */
  var HtmlPdfCLIGenerator = module.exports = TemplateGenerator.extend({



    init: function() {
      this._super( 'pdf', 'html' );
    },



    /**
    Generate the binary PDF.
    */
    onBeforeSave: function( info ) {
      try {
        engines[ info.opts.pdf || 'wkhtmltopdf' ]
        .call( this, info.mk, info.outputFile );
        return null; // halt further processing
      }
      catch(ex) {
        // { [Error: write EPIPE] code: 'EPIPE', errno: 'EPIPE', ... }
        // { [Error: ENOENT] }
        throw { fluenterror: this.codes.pdfGeneration, inner: ex };
      }
    }

  });



  var engines = {



    /**
    Generate a PDF from HTML using wkhtmltopdf.
    */
    wkhtmltopdf: function(markup, fOut) {

      // Save the markup to a temporary file
      var tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync( tempFile, markup, 'utf8' );

      var spawn = require('child_process').spawn;
      var child = spawn('wkhtmltopdf', [
        tempFile, fOut
      ]);

      // child.stdout.on('data', function(chunk) {
      //   // output will be here in chunks
      // });

      // or if you want to send output elsewhere
      //child.stdout.pipe(dest);
    },



    /**
    Generate a PDF from HTML using Phantom.
    See: https://github.com/ariya/phantomjs/blob/master/examples/rasterize.js
    */
    phantom: function( markup, fOut ) {

      // Save the markup to a temporary file
      var tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync( tempFile, markup, 'utf8' );

      var scriptPath = SLASH( PATH.relative( process.cwd(),
        PATH.resolve( __dirname, '../utils/rasterize.js' ) ) );
      var sourcePath = SLASH( PATH.relative( process.cwd(), tempFile) );
      var destPath = SLASH( PATH.relative( process.cwd(), fOut) );

      var spawn = require('child_process').spawn;
      var child = spawn('phantomjs', [ scriptPath, sourcePath, destPath ]);

      // child.stdout.on('data', function(chunk) {
      //   // output will be here in chunks
      // });
      //
      // // or if you want to send output elsewhere
      // child.stdout.pipe(dest);
    }

  };



}());
