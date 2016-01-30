###
Definition of the WordGenerator class.
@license MIT. See LICENSE.md for details.
@module generators/word-generator
###


TemplateGenerator = require './template-generator'

WordGenerator = module.exports = TemplateGenerator.extend
  init: () -> @_super 'doc', 'xml'
