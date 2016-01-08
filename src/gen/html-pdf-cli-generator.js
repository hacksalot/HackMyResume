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
  wkhtmltopdf, and other PDF engines over a CLI (command-line interface).
  If an engine isn't installed for a particular platform, error out gracefully.
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
        var safe_eng = info.opts.pdf || 'wkhtmltopdf';
        engines[ safe_eng ].call( this, info.mk, info.outputFile );
        return null; // halt further processing
      }
      catch(ex) {
        // { [Error: write EPIPE] code: 'EPIPE', errno: 'EPIPE', ... }
        // { [Error: ENOENT] }
        throw ( ex.inner && ex.inner.code === 'ENOENT' ) ?
          { fluenterror: this.codes.notOnPath, engine: ex.cmd } :
          { fluenterror: this.codes.pdfGeneration, inner: ex.inner };
      }
    }



  });



  // TODO: Move each engine to a separate module
  var engines = {



    /**
    Generate a PDF from HTML using wkhtmltopdf's CLI interface.
    Spawns a child process with `wkhtmltopdf <source> <target>`. wkhtmltopdf
    must be installed and path-accessible.
    TODO: If HTML generation has run, reuse that output
    TODO: Local web server to ease wkhtmltopdf rendering
    */
    wkhtmltopdf: function(markup, fOut) {

      // Save the markup to a temporary file
      var tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync( tempFile, markup, 'utf8' );

      var spawn = require('child_process').spawnSync;
      var info = spawn('wkhtmltopdf', [
        tempFile, fOut
      ]);
      if( info.error ) {
        throw {
          cmd: 'wkhtmltopdf',
          inner: info.error
        };
      }

      // child.stdout.on('data', function(chunk) {
      //   // output will be here in chunks
      // });

      // or if you want to send output elsewhere
      //child.stdout.pipe(dest);
    },



    /**
    Generate a PDF from HTML using Phantom's CLI interface.
    Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
    must be installed and path-accessible.
    TODO: If HTML generation has run, reuse that output
    TODO: Local web server to ease Phantom rendering
    */
    phantom: function( markup, fOut ) {

      // Save the markup to a temporary file
      var tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync( tempFile, markup, 'utf8' );

      var scriptPath = SLASH( PATH.relative( process.cwd(),
        PATH.resolve( __dirname, '../utils/rasterize.js' ) ) );
      var sourcePath = SLASH( PATH.relative( process.cwd(), tempFile) );
      var destPath = SLASH( PATH.relative( process.cwd(), fOut) );

      var spawn = require('child_process').spawnSync;
      var info = spawn('phantomjs', [ scriptPath, sourcePath, destPath ]);
      if( info.error ) {
        throw {
          cmd: 'phantomjs',
          inner: info.error
        };
      }

      // child.stdout.on('data', function(chunk) {
      //   // output will be here in chunks
      // });
      //
      // // or if you want to send output elsewhere
      // child.stdout.pipe(dest);
    }

  };



}());
