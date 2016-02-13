###*
Definition of the HtmlPdfCLIGenerator class.
@module generators/html-pdf-generator.js
@license MIT. See LICENSE.md for details.
###



TemplateGenerator = require './template-generator'
FS = require 'fs-extra'
PATH = require 'path'
SLASH = require 'slash'
_ = require 'underscore'
HMSTATUS = require '../core/status-codes'
SPAWN = require '../utils/safe-spawn'


###*
An HTML-driven PDF resume generator for HackMyResume. Talks to Phantom,
wkhtmltopdf, and other PDF engines over a CLI (command-line interface).
If an engine isn't installed for a particular platform, error out gracefully.
###

module.exports = class HtmlPdfCLIGenerator extends TemplateGenerator



  constructor: () -> super 'pdf', 'html'



  ###* Generate the binary PDF. ###
  onBeforeSave: ( info ) ->
    #console.dir _.omit( info, 'mk' ), depth: null, colors: true
    return info.mk if info.ext != 'html' and info.ext != 'pdf'
    safe_eng = info.opts.pdf || 'wkhtmltopdf'
    safe_eng = 'phantomjs' if safe_eng == 'phantom'
    if _.has engines, safe_eng
      @errHandler = info.opts.errHandler
      engines[ safe_eng ].call @, info.mk, info.outputFile, @onError
      return null # halt further processing



  ### Low-level error callback for spawn(). May be called after HMR process
  termination, so object references may not be valid here. That's okay; if
  the references are invalid, the error was already logged. We could use
  spawn-watch here but that causes issues on legacy Node.js. ###
  onError: (ex, param) ->
    param.errHandler?.err? HMSTATUS.pdfGeneration, ex
    return



# TODO: Move each engine to a separate module
engines =



  ###*
  Generate a PDF from HTML using wkhtmltopdf's CLI interface.
  Spawns a child process with `wkhtmltopdf <source> <target>`. wkhtmltopdf
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease wkhtmltopdf rendering
  ###
  wkhtmltopdf: (markup, fOut, on_error) ->
    # Save the markup to a temporary file
    tempFile = fOut.replace /\.pdf$/i, '.pdf.html'
    FS.writeFileSync tempFile, markup, 'utf8'
    SPAWN 'wkhtmltopdf', [ tempFile, fOut ], false, on_error, @
    return



  ###*
  Generate a PDF from HTML using Phantom's CLI interface.
  Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease Phantom rendering
  ###
  phantomjs: ( markup, fOut, on_error ) ->
    # Save the markup to a temporary file
    tempFile = fOut.replace /\.pdf$/i, '.pdf.html'
    FS.writeFileSync tempFile, markup, 'utf8'
    scriptPath = PATH.relative process.cwd(), PATH.resolve( __dirname, '../utils/rasterize.js' )
    scriptPath = SLASH scriptPath
    sourcePath = SLASH PATH.relative( process.cwd(), tempFile)
    destPath = SLASH PATH.relative( process.cwd(), fOut)
    SPAWN 'phantomjs', [ scriptPath, sourcePath, destPath ], false, on_error, @
    return
