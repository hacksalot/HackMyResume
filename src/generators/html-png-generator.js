/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the HtmlPngGenerator class.
@module generators/html-png-generator
@license MIT. See LICENSE.MD for details.
*/



const TemplateGenerator = require('./template-generator');
const FS = require('fs-extra');
const SLASH = require('slash');
const SPAWN = require('../utils/safe-spawn');
const PATH = require('path');


/**
An HTML-based PNG resume generator for HackMyResume.
*/
class HtmlPngGenerator extends TemplateGenerator {

  constructor() { super('png', 'html'); }

  invoke( /*rez, themeMarkup, cssInfo, opts*/ ) {}
    // TODO: Not currently called or callable.

  generate( rez, f, opts ) {
    const htmlResults = opts.targets.filter(t => t.fmt.outFormat === 'html');
    const htmlFile = htmlResults[0].final.files.filter(fl => fl.info.ext === 'html');
    phantom(htmlFile[0].data, f);
  }
}

module.exports = HtmlPngGenerator;

/**
Generate a PDF from HTML using Phantom's CLI interface.
Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
must be installed and path-accessible.
TODO: If HTML generation has run, reuse that output
TODO: Local web server to ease Phantom rendering
*/

var phantom = function( markup, fOut ) {

  // Save the markup to a temporary file
  const tempFile = fOut.replace(/\.png$/i, '.png.html');
  FS.writeFileSync(tempFile, markup, 'utf8');
  const scriptPath = SLASH( PATH.relative( process.cwd(),
    PATH.resolve( __dirname, '../utils/rasterize.js' ) ) );
  const sourcePath = SLASH( PATH.relative( process.cwd(), tempFile) );
  const destPath = SLASH( PATH.relative( process.cwd(), fOut) );
  SPAWN('phantomjs', [ scriptPath, sourcePath, destPath ]);
};
