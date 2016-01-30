
/**
Definition of the HtmlPngGenerator class.
@license MIT. See LICENSE.MD for details.
@module html-png-generator.js
 */

(function() {
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

  HtmlPngGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('png', 'html');
    },
    invoke: function(rez, themeMarkup, cssInfo, opts) {},
    generate: function(rez, f, opts) {
      var htmlFile, htmlResults;
      htmlResults = opts.targets.filter(function(t) {
        return t.fmt.outFormat === 'html';
      });
      htmlFile = htmlResults[0].final.files.filter(function(fl) {
        return fl.info.ext === 'html';
      });
      phantom(htmlFile[0].data, f);
    }
  });


  /**
  Generate a PDF from HTML using Phantom's CLI interface.
  Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease Phantom rendering
   */

  phantom = function(markup, fOut) {
    var destPath, info, scriptPath, sourcePath, tempFile;
    tempFile = fOut.replace(/\.png$/i, '.png.html');
    FS.writeFileSync(tempFile, markup, 'utf8');
    scriptPath = SLASH(PATH.relative(process.cwd(), PATH.resolve(__dirname, '../utils/rasterize.js')));
    sourcePath = SLASH(PATH.relative(process.cwd(), tempFile));
    destPath = SLASH(PATH.relative(process.cwd(), fOut));
    info = SPAWN('phantomjs', [scriptPath, sourcePath, destPath]);
  };

}).call(this);
