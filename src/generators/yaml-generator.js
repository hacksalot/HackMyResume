/**
Definition of the YAMLGenerator class.
@module yaml-generator.js
@license MIT. See LICENSE.md for details.
*/


const TemplateGenerator = require('./template-generator');

/**
YamlGenerator generates a YAML-formatted resume via TemplateGenerator.
*/

class YAMLGenerator extends TemplateGenerator {
  constructor() { super('yml', 'yml'); }
}


module.exports = YAMLGenerator;
