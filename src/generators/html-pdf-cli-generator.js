/*
 * decaffeinate suggestions:
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the HtmlPdfCLIGenerator class.
@module generators/html-pdf-generator.js
@license MIT. See LICENSE.md for details.
*/



const TemplateGenerator = require('./template-generator');
const FS = require('fs-extra');
const PATH = require('path');
const SLASH = require('slash');
const _ = require('underscore');
const HMSTATUS = require('../core/status-codes');
const SPAWN = require('../utils/safe-spawn');


/**
An HTML-driven PDF resume generator for HackMyResume. Talks to Phantom,
wkhtmltopdf, and other PDF engines over a CLI (command-line interface).
If an engine isn't installed for a particular platform, error out gracefully.
*/

class HtmlPdfCLIGenerator extends TemplateGenerator {



  constructor() { super('pdf', 'html'); }



  /** Generate the binary PDF. */
  onBeforeSave( info ) {
    //console.dir _.omit( info, 'mk' ), depth: null, colors: true
    if ((info.ext !== 'html') && (info.ext !== 'pdf')) { return info.mk; }
    let safe_eng = info.opts.pdf || 'wkhtmltopdf';
    if (safe_eng === 'phantom') { safe_eng = 'phantomjs'; }
    if (_.has(engines, safe_eng)) {
      this.errHandler = info.opts.errHandler;
      engines[ safe_eng ].call(this, info.mk, info.outputFile, info.opts, this.onError);
      return null; // halt further processing
    }
  }



  /* Low-level error callback for spawn(). May be called after HMR process
  termination, so object references may not be valid here. That's okay; if
  the references are invalid, the error was already logged. We could use
  spawn-watch here but that causes issues on legacy Node.js. */
  onError(ex, param) {
    __guardMethod__(param.errHandler, 'err', o => o.err(HMSTATUS.pdfGeneration, ex));
  }
}

module.exports = HtmlPdfCLIGenerator;

// TODO: Move each engine to a separate module
var engines = {



  /**
  Generate a PDF from HTML using wkhtmltopdf's CLI interface.
  Spawns a child process with `wkhtmltopdf <source> <target>`. wkhtmltopdf
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease wkhtmltopdf rendering
  */
  wkhtmltopdf(markup, fOut, opts, on_error) {
    // Save the markup to a temporary file
    const tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
    FS.writeFileSync(tempFile, markup, 'utf8');

    // Prepare wkhtmltopdf arguments.
    let wkopts = _.extend({'margin-top': '10mm', 'margin-bottom': '10mm'}, opts.wkhtmltopdf);
    wkopts = _.flatten(_.map(wkopts, (v, k) => [`--${k}`, v]));
    const wkargs = wkopts.concat([ tempFile, fOut  ]);

    SPAWN('wkhtmltopdf', wkargs , false, on_error, this);
  },



  /**
  Generate a PDF from HTML using Phantom's CLI interface.
  Spawns a child process with `phantomjs <script> <source> <target>`. Phantom
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  TODO: Local web server to ease Phantom rendering
  */
  phantomjs( markup, fOut, opts, on_error ) {
    // Save the markup to a temporary file
    const tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
    FS.writeFileSync(tempFile, markup, 'utf8');
    let scriptPath = PATH.relative(process.cwd(), PATH.resolve( __dirname, '../utils/rasterize.js' ));
    scriptPath = SLASH(scriptPath);
    const sourcePath = SLASH(PATH.relative( process.cwd(), tempFile));
    const destPath = SLASH(PATH.relative( process.cwd(), fOut));
    SPAWN('phantomjs', [ scriptPath, sourcePath, destPath ], false, on_error, this);
  },

  /**
  Generate a PDF from HTML using WeasyPrint's CLI interface.
  Spawns a child process with `weasyprint <source> <target>`. Weasy Print
  must be installed and path-accessible.
  TODO: If HTML generation has run, reuse that output
  */
  weasyprint( markup, fOut, opts, on_error ) {
    // Save the markup to a temporary file
    const tempFile = fOut.replace(/\.pdf$/i, '.pdf.html');
    FS.writeFileSync(tempFile, markup, 'utf8');

    SPAWN('weasyprint', [tempFile, fOut], false, on_error, this);
  }
};

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}
