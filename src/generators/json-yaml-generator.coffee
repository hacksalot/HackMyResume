###*
Definition of the JsonYamlGenerator class.
@module json-yaml-generator.js
@license MIT. See LICENSE.md for details.
###



BaseGenerator = require('./base-generator')
FS = require('fs')
YAML = require('yamljs')



###*
JsonYamlGenerator takes a JSON resume object and translates it directly to
JSON without a template, producing an equivalent YAML-formatted resume. See
also YamlGenerator (yaml-generator.js).
###

JsonYamlGenerator = module.exports = BaseGenerator.extend

  init: () -> @_super 'yml'

  invoke: ( rez, themeMarkup, cssInfo, opts ) ->
    YAML.stringify JSON.parse( rez.stringify() ), Infinity, 2

  generate: ( rez, f, opts ) ->
    data = YAML.stringify JSON.parse( rez.stringify() ), Infinity, 2
    FS.writeFileSync f, data, 'utf8'
    data
