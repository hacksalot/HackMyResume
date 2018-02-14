###*
Definition of the TextGenerator class.
@module generators/text-generator
@license MIT. See LICENSE.md for details.
###

TemplateGenerator = require './template-generator'

###*
The TextGenerator generates a plain-text resume via the TemplateGenerator.
###
module.exports = class TextGenerator extends TemplateGenerator

  constructor: () -> super 'txt'
