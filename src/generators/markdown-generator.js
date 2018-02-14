/**
Definition of the MarkdownGenerator class.
@module generators/markdown-generator
@license MIT. See LICENSE.md for details.
*/

const TemplateGenerator = require('./template-generator');

/**
MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
*/
class MarkdownGenerator extends TemplateGenerator {

  constructor() { super('md', 'txt'); }
}

module.exports = MarkdownGenerator;
