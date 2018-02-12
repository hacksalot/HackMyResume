(function() {
  /**
  Definition of the HtmlPdfCLIGenerator class.
  @module generators/html-pdf-generator.js
  @license MIT. See LICENSE.md for details.
  */
  var FS, HMSTATUS, HtmlPdfCLIGenerator, PATH, SLASH, SPAWN, TemplateGenerator, _, engines;

  TemplateGenerator = require('./template-generator');

  FS = require('fs-extra');

  PATH = require('path');

  SLASH = require('slash');

  _ = require('underscore');

  HMSTATUS = require('../core/status-codes');

  SPAWN = require('../utils/safe-spawn');

  /**
  An HTML-driven PDF resume generator for HackMyResume. Talks to Phantom,
  wkhtmltopdf, and other PDF engines over a CLI (command-line interface).
  If an engine isn't installed for a particular platform, error out gracefully.
  */
  module.exports = HtmlPdfCLIGenerator = class HtmlPdfCLIGenerator extends TemplateGenerator {
    constructor() {
      super('pdf', 'html');
    }

    /** Generate the binary PDF. */
    onBeforeSave(info) {
      var safe_eng;
      if (info.ext !== 'html' && info.ext !== 'pdf') {
        //console.dir _.omit( info, 'mk' ), depth: null, colors: true
        return info.mk;
      }
      safe_eng = info.opts.pdf || 'wkhtmltopdf';
      if (safe_eng === 'phantom') {
        safe_eng = 'phantomjs';
      }
      if (_.has(engines, safe_eng)) {
        this.errHandler = info.opts.errHandler;
        engines[safe_eng].call(this, info.mk, info.outputFile, info.opts, this.onError);
        return null; // halt further processing
      }
    }

    /* Low-level error callback for spawn(). May be called after HMR process
    termination, so object references may not be valid here. That's okay; if
    the references are invalid, the error was already logged. We could use
    spawn-watch here but that causes issues on legacy Node.js. */
    onError(ex, param) {
      var ref;
      if ((ref = param.errHandler) != null) {
        if (typeof ref.err === "function") {
          ref.err(HMSTATUS.pdfGeneration, ex);
        }
      }
    }

  };

  // TODO: Move each engine to a separate module
  engines = {
    /**
    Generate a PDF from HTML using wkhtmltopdf's CLI interface.
    Spawns a child process with `wkhtmltopdf <source> <target>`. wkhtmltopdf
    must be installed and path-accessible.
    TODO: If HTML generation has run, reuse that output
    TODO: Local web server to ease wkhtmltopdf rendering
    */
    wkhtmltopdf: function(markup, fOut, opts, on_error) {
      var tempFile, wkargs, wkopts;
      // Save the markup to a temporary file
      tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync(tempFile, markup, 'utf8');
      // Prepare wkhtmltopdf arguments.
      wkopts = _.extend({
        'margin-top': '10mm',
        'margin-bottom': '10mm'
      }, opts.wkhtmltopdf);
      wkopts = _.flatten(_.map(wkopts, function(v, k) {
        return ['--' + k, v];
      }));
      wkargs = wkopts.concat([tempFile, fOut]);
      SPAWN('wkhtmltopdf', wkargs, false, on_error, this);
    },
    /**
    Generate a PDF from HTML using Phantom's CLI interface.
    Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
    must be installed and path-accessible.
    TODO: If HTML generation has run, reuse that output
    TODO: Local web server to ease Phantom rendering
    */
    phantomjs: function(markup, fOut, opts, on_error) {
      var destPath, scriptPath, sourcePath, tempFile;
      // Save the markup to a temporary file
      tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync(tempFile, markup, 'utf8');
      scriptPath = PATH.relative(process.cwd(), PATH.resolve(__dirname, '../utils/rasterize.js'));
      scriptPath = SLASH(scriptPath);
      sourcePath = SLASH(PATH.relative(process.cwd(), tempFile));
      destPath = SLASH(PATH.relative(process.cwd(), fOut));
      SPAWN('phantomjs', [scriptPath, sourcePath, destPath], false, on_error, this);
    },
    /**
    Generate a PDF from HTML using WeasyPrint's CLI interface.
    Spawns a child process with `weasyprint <source> <target>`. Weasy Print
    must be installed and path-accessible.
    TODO: If HTML generation has run, reuse that output
    */
    weasyprint: function(markup, fOut, opts, on_error) {
      var tempFile;
      // Save the markup to a temporary file
      tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
      FS.writeFileSync(tempFile, markup, 'utf8');
      SPAWN('weasyprint', [tempFile, fOut], false, on_error, this);
    }
  };

}).call(this);

//# sourceMappingURL=html-pdf-cli-generator.js.map
