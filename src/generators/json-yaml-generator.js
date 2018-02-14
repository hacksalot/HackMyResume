/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the JsonYamlGenerator class.
@module generators/json-yaml-generator
@license MIT. See LICENSE.md for details.
*/



const BaseGenerator = require('./base-generator');
const FS = require('fs');
const YAML = require('yamljs');



/**
JsonYamlGenerator takes a JSON resume object and translates it directly to
JSON without a template, producing an equivalent YAML-formatted resume. See
also YamlGenerator (yaml-generator.js).
*/

class JsonYamlGenerator extends BaseGenerator {

  constructor() { super('yml'); }

  invoke( rez/*, themeMarkup, cssInfo, opts*/ ) {
    return YAML.stringify(JSON.parse( rez.stringify() ), Infinity, 2);
  }

  generate( rez, f/*, opts */) {
    const data = YAML.stringify(JSON.parse( rez.stringify() ), Infinity, 2);
    FS.writeFileSync(f, data, 'utf8');
    return data;
  }
}

module.exports = JsonYamlGenerator;
