(function() {
  /**
  Definition of the HtmlPngGenerator class.
  @module generators/html-png-generator
  @license MIT. See LICENSE.MD for details.
  */
  /**
  Generate a PDF from HTML using Phantom's CLI interface.
  Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease Phantom rendering
  */
  var FS, HTML, HtmlPngGenerator, PATH, SLASH, SPAWN, TemplateGenerator, phantom;

  TemplateGenerator = require('./template-generator');

  FS = require('fs-extra');

  HTML = require('html');

  SLASH = require('slash');

  SPAWN = require('../utils/safe-spawn');

  PATH = require('path');

  /**
  An HTML-based PNG resume generator for HackMyResume.
  */
  module.exports = HtmlPngGenerator = class HtmlPngGenerator extends TemplateGenerator {
    constructor() {
      super('png', 'html');
    }

    invoke(rez, themeMarkup, cssInfo, opts) {}

    // TODO: Not currently called or callable.
    generate(rez, f, opts) {
      var htmlFile, htmlResults;
      htmlResults = opts.targets.filter(function(t) {
        return t.fmt.outFormat === 'html';
      });
      htmlFile = htmlResults[0].final.files.filter(function(fl) {
        return fl.info.ext === 'html';
      });
      phantom(htmlFile[0].data, f);
    }

  };

  phantom = function(markup, fOut) {
    var destPath, info, scriptPath, sourcePath, tempFile;
    // Save the markup to a temporary file
    tempFile = fOut.replace(/\.png$/i, '.png.html');
    FS.writeFileSync(tempFile, markup, 'utf8');
    scriptPath = SLASH(PATH.relative(process.cwd(), PATH.resolve(__dirname, '../utils/rasterize.js')));
    sourcePath = SLASH(PATH.relative(process.cwd(), tempFile));
    destPath = SLASH(PATH.relative(process.cwd(), fOut));
    info = SPAWN('phantomjs', [scriptPath, sourcePath, destPath]);
  };

}).call(this);

//# sourceMappingURL=html-png-generator.js.map
