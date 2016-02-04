###
Definition of the WordGenerator class.
@module generators/word-generator
@license MIT. See LICENSE.md for details.
###


TemplateGenerator = require './template-generator'

module.exports = class WordGenerator extends TemplateGenerator

  constructor: () -> super 'doc', 'xml'
