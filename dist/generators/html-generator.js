(function() {
  /**
  Definition of the HTMLGenerator class.
  @module generators/html-generator
  @license MIT. See LICENSE.md for details.
  */
  var FS, HTML, HtmlGenerator, PATH, TemplateGenerator;

  TemplateGenerator = require('./template-generator');

  FS = require('fs-extra');

  HTML = require('html');

  PATH = require('path');

  require('string.prototype.endswith');

  module.exports = HtmlGenerator = class HtmlGenerator extends TemplateGenerator {
    constructor() {
      super('html');
    }

    /**
    Copy satellite CSS files to the destination and optionally pretty-print
    the HTML resume prior to saving.
    */
    onBeforeSave(info) {
      if (info.outputFile.endsWith('.css')) {
        return info.mk;
      }
      if (this.opts.prettify) {
        return HTML.prettyPrint(info.mk, this.opts.prettify);
      } else {
        return info.mk;
      }
    }

  };

}).call(this);

//# sourceMappingURL=html-generator.js.map
