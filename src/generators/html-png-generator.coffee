###*
Definition of the HtmlPngGenerator class.
@module generators/html-png-generator
@license MIT. See LICENSE.MD for details.
###



TemplateGenerator = require './template-generator'
FS = require 'fs-extra'
HTML = require 'html'
SLASH = require 'slash'
SPAWN = require '../utils/safe-spawn'
PATH = require 'path'


###*
An HTML-based PNG resume generator for HackMyResume.
###
module.exports = class HtmlPngGenerator extends TemplateGenerator

  constructor: -> super 'png', 'html'

  invoke: ( rez, themeMarkup, cssInfo, opts ) ->
    # TODO: Not currently called or callable.

  generate: ( rez, f, opts ) ->
    htmlResults = opts.targets.filter (t) -> t.fmt.outFormat == 'html'
    htmlFile = htmlResults[0].final.files.filter (fl) ->
      fl.info.ext == 'html'
    phantom htmlFile[0].data, f
    return

###*
Generate a PDF from HTML using Phantom's CLI interface.
Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
must be installed and path-accessible.
TODO: If HTML generation has run, reuse that output
TODO: Local web server to ease Phantom rendering
###

phantom = ( markup, fOut ) ->

  # Save the markup to a temporary file
  tempFile = fOut.replace(/\.png$/i, '.png.html');
  FS.writeFileSync tempFile, markup, 'utf8'
  scriptPath = SLASH( PATH.relative( process.cwd(),
    PATH.resolve( __dirname, '../utils/rasterize.js' ) ) );
  sourcePath = SLASH( PATH.relative( process.cwd(), tempFile) );
  destPath = SLASH( PATH.relative( process.cwd(), fOut) );
  info = SPAWN('phantomjs', [ scriptPath, sourcePath, destPath ]);
  return
