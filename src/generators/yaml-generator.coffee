###*
Definition of the YAMLGenerator class.
@module yaml-generator.js
@license MIT. See LICENSE.md for details.
###


TemplateGenerator = require './template-generator'

###*
YamlGenerator generates a YAML-formatted resume via TemplateGenerator.
###

YAMLGenerator = module.exports = TemplateGenerator.extend
  init: () -> @_super 'yml', 'yml'
