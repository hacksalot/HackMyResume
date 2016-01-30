###*
Definition of the HtmlPdfCLIGenerator class.
@module html-pdf-generator.js
@license MIT. See LICENSE.md for details.
###



TemplateGenerator = require('./template-generator')
FS = require('fs-extra')
HTML = require( 'html' )
PATH = require('path')
SPAWN = require('../utils/safe-spawn')
SLASH = require('slash');



###*
An HTML-driven PDF resume generator for HackMyResume. Talks to Phantom,
wkhtmltopdf, and other PDF engines over a CLI (command-line interface).
If an engine isn't installed for a particular platform, error out gracefully.
###

HtmlPdfCLIGenerator = module.exports = TemplateGenerator.extend


  init: () -> @_super 'pdf', 'html'


  ###* Generate the binary PDF. ###
  onBeforeSave: ( info ) ->
    try
      safe_eng = info.opts.pdf || 'wkhtmltopdf';
      if safe_eng != 'none'
        engines[ safe_eng ].call this, info.mk, info.outputFile
        return null # halt further processing
    catch ex
      # { [Error: write EPIPE] code: 'EPIPE', errno: 'EPIPE', ... }
      # { [Error: ENOENT] }
      if ex.inner && ex.inner.code == 'ENOENT'
        throw
          fluenterror: this.codes.notOnPath
          inner: ex.inner
          engine: ex.cmd,
          stack: ex.inner && ex.inner.stack
      else
        throw
          fluenterror: this.codes.pdfGeneration
          inner: ex
          stack: ex.stack



# TODO: Move each engine to a separate module
engines =



  ###*
  Generate a PDF from HTML using wkhtmltopdf's CLI interface.
  Spawns a child process with `wkhtmltopdf <source> <target>`. wkhtmltopdf
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease wkhtmltopdf rendering
  ###
  wkhtmltopdf: (markup, fOut) ->
    # Save the markup to a temporary file
    tempFile = fOut.replace /\.pdf$/i, '.pdf.html'
    FS.writeFileSync tempFile, markup, 'utf8'
    info = SPAWN 'wkhtmltopdf', [ tempFile, fOut ]



  ###*
  Generate a PDF from HTML using Phantom's CLI interface.
  Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease Phantom rendering
  ###

  phantom: ( markup, fOut ) ->

    # Save the markup to a temporary file
    tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
    FS.writeFileSync tempFile, markup, 'utf8'
    scriptPath = SLASH( PATH.relative( process.cwd(),
      PATH.resolve( __dirname, '../utils/rasterize.js' ) ) );
    sourcePath = SLASH( PATH.relative( process.cwd(), tempFile) );
    destPath = SLASH( PATH.relative( process.cwd(), fOut) );
    info = SPAWN('phantomjs', [ scriptPath, sourcePath, destPath ]);
