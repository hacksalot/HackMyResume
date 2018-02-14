/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the HTMLGenerator class.
@module generators/html-generator
@license MIT. See LICENSE.md for details.
*/



let HtmlGenerator;
const TemplateGenerator = require('./template-generator');
const FS = require('fs-extra');
const HTML = require('html');
const PATH = require('path');
require('string.prototype.endswith');



module.exports = (HtmlGenerator = class HtmlGenerator extends TemplateGenerator {

  constructor() { super('html'); }

  /**
  Copy satellite CSS files to the destination and optionally pretty-print
  the HTML resume prior to saving.
  */
  onBeforeSave( info ) {
    if (info.outputFile.endsWith('.css')) {
      return info.mk;
    }
    if (this.opts.prettify) {
    return HTML.prettyPrint(info.mk, this.opts.prettify);
    } else { return info.mk; }
  }
});
