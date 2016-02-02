
/**
Definition of the MarkdownGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module markdown-generator.js
 */

(function() {
  var MarkdownGenerator, TemplateGenerator;

  TemplateGenerator = require('./template-generator');


  /**
  MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
   */

  MarkdownGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('md', 'txt');
    }
  });

}).call(this);

//# sourceMappingURL=markdown-generator.js.map
