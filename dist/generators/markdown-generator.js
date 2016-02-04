
/**
Definition of the MarkdownGenerator class.
@module generators/markdown-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var MarkdownGenerator, TemplateGenerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TemplateGenerator = require('./template-generator');


  /**
  MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
   */

  module.exports = MarkdownGenerator = (function(superClass) {
    extend(MarkdownGenerator, superClass);

    function MarkdownGenerator() {
      MarkdownGenerator.__super__.constructor.call(this, 'md', 'txt');
    }

    return MarkdownGenerator;

  })(TemplateGenerator);

}).call(this);

//# sourceMappingURL=markdown-generator.js.map
