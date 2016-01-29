
/**
Definition of the HTMLGenerator class.
@license MIT. See LICENSE.md for details.
@module html-generator.js
 */

(function() {
  var FS, HTML, HtmlGenerator, PATH, TemplateGenerator;

  TemplateGenerator = require('./template-generator');

  FS = require('fs-extra');

  HTML = require('html');

  PATH = require('path');

  require('string.prototype.endswith');

  HtmlGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('html');
    },

    /**
    Copy satellite CSS files to the destination and optionally pretty-print
    the HTML resume prior to saving.
     */
    onBeforeSave: function(info) {
      if (info.outputFile.endsWith('.css')) {
        return info.mk;
      }
      if (this.opts.prettify) {
        return HTML.prettyPrint(info.mk, this.opts.prettify);
      } else {
        return info.mk;
      }
    }
  });

}).call(this);
