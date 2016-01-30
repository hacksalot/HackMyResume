###*
Definition of the MarkdownGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module markdown-generator.js
###

TemplateGenerator = require './template-generator'

###*
MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
###
MarkdownGenerator = module.exports = TemplateGenerator.extend

  init: () -> @_super 'md', 'txt'
