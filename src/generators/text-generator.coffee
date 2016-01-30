###*
Definition of the TextGenerator class.
@license MIT. See LICENSE.md for details.
@module text-generator.js
###

TemplateGenerator = require './template-generator'

###*
The TextGenerator generates a plain-text resume via the TemplateGenerator.
###
TextGenerator = module.exports = TemplateGenerator.extend

  init: () -> @_super 'txt'
