
/**
Definition of the HtmlPdfCLIGenerator class.
@module html-pdf-generator.js
@license MIT. See LICENSE.md for details.
 */

(function() {
  var FS, HMSTATUS, HtmlPdfCLIGenerator, PATH, SLASH, TemplateGenerator, _, engines;

  TemplateGenerator = require('./template-generator');

  FS = require('fs-extra');

  PATH = require('path');

  SLASH = require('slash');

  _ = require('underscore');

  HMSTATUS = require('../core/status-codes');


  /**
  An HTML-driven PDF resume generator for HackMyResume. Talks to Phantom,
  wkhtmltopdf, and other PDF engines over a CLI (command-line interface).
  If an engine isn't installed for a particular platform, error out gracefully.
   */

  HtmlPdfCLIGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('pdf', 'html');
    },

    /** Generate the binary PDF. */
    onBeforeSave: function(info) {
      var safe_eng;
      safe_eng = info.opts.pdf || 'wkhtmltopdf';
      if (safe_eng === 'phantom') {
        safe_eng = 'phantomjs';
      }
      if (_.has(engines, safe_eng)) {
        this.SPAWN = require('../utils/safe-spawn');
        this.errHandler = info.opts.errHandler;
        engines[safe_eng].call(this, info.mk, info.outputFile, this.onError);
        return null;
      }
    },

    /* Low-level error callback for spawn(). May be called after HMR process
    termination, so object references may not be valid here. That's okay; if
    the references are invalid, the error was already logged. We could use
    spawn-watch here but that causes issues on legacy Node.js.
     */
    onError: function(ex, param) {
      var ref;
      if ((ref = param.errHandler) != null) {
        if (typeof ref.err === "function") {
          ref.err(HMSTATUS.pdfGeneration, ex);
        }
      }
    }
  });

  engines = {

    /**
    Generate a PDF from HTML using wkhtmltopdf's CLI interface.
    Spawns a child process with `wkhtmltopdf <source> <target>`. wkhtmltopdf
    must be installed and path-accessible.
    TODO: If HTML generation has run, reuse that output
    TODO: Local web server to ease wkhtmltopdf rendering
     */
    wkhtmltopdf: function(markup, fOut, on_error) {
      var tempFile;
      tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync(tempFile, markup, 'utf8');
      return this.SPAWN('wkhtmltopdf', [tempFile, fOut], false, on_error, this);
    },

    /**
    Generate a PDF from HTML using Phantom's CLI interface.
    Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
    must be installed and path-accessible.
    TODO: If HTML generation has run, reuse that output
    TODO: Local web server to ease Phantom rendering
     */
    phantomjs: function(markup, fOut, on_error) {
      var destPath, scriptPath, sourcePath, tempFile;
      tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync(tempFile, markup, 'utf8');
      scriptPath = SLASH(PATH.relative(process.cwd(), PATH.resolve(__dirname, '../utils/rasterize.js')));
      sourcePath = SLASH(PATH.relative(process.cwd(), tempFile));
      destPath = SLASH(PATH.relative(process.cwd(), fOut));
      return this.SPAWN('phantomjs', [scriptPath, sourcePath, destPath], false, on_error, this);
    }
  };

}).call(this);

//# sourceMappingURL=html-pdf-cli-generator.js.map
