(function() {
  /**
  Definition of the MarkdownGenerator class.
  @module generators/markdown-generator
  @license MIT. See LICENSE.md for details.
  */
  var MarkdownGenerator, TemplateGenerator;

  TemplateGenerator = require('./template-generator');

  /**
  MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
  */
  module.exports = MarkdownGenerator = class MarkdownGenerator extends TemplateGenerator {
    constructor() {
      super('md', 'txt');
    }

  };

}).call(this);

//# sourceMappingURL=markdown-generator.js.map
