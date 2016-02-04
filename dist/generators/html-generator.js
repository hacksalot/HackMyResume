
/**
Definition of the HTMLGenerator class.
@module generators/html-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var FS, HTML, HtmlGenerator, PATH, TemplateGenerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TemplateGenerator = require('./template-generator');

  FS = require('fs-extra');

  HTML = require('html');

  PATH = require('path');

  require('string.prototype.endswith');

  module.exports = HtmlGenerator = (function(superClass) {
    extend(HtmlGenerator, superClass);

    function HtmlGenerator() {
      HtmlGenerator.__super__.constructor.call(this, 'html');
    }


    /**
    Copy satellite CSS files to the destination and optionally pretty-print
    the HTML resume prior to saving.
     */

    HtmlGenerator.prototype.onBeforeSave = function(info) {
      if (info.outputFile.endsWith('.css')) {
        return info.mk;
      }
      if (this.opts.prettify) {
        return HTML.prettyPrint(info.mk, this.opts.prettify);
      } else {
        return info.mk;
      }
    };

    return HtmlGenerator;

  })(TemplateGenerator);

}).call(this);

//# sourceMappingURL=html-generator.js.map
