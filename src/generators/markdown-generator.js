###*
Definition of the MarkdownGenerator class.
@module generators/markdown-generator
@license MIT. See LICENSE.md for details.
###

TemplateGenerator = require './template-generator'

###*
MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
###
module.exports = class MarkdownGenerator extends TemplateGenerator

  constructor: () -> super 'md', 'txt'
