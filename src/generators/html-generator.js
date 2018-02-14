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



const TemplateGenerator = require('./template-generator');
const HTML = require('html');
require('string.prototype.endswith');



class HtmlGenerator extends TemplateGenerator {

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
}


module.exports = HtmlGenerator;
