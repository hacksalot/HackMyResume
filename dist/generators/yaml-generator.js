(function() {
  /**
  Definition of the YAMLGenerator class.
  @module yaml-generator.js
  @license MIT. See LICENSE.md for details.
  */
  var TemplateGenerator, YAMLGenerator;

  TemplateGenerator = require('./template-generator');

  /**
  YamlGenerator generates a YAML-formatted resume via TemplateGenerator.
  */
  module.exports = YAMLGenerator = class YAMLGenerator extends TemplateGenerator {
    constructor() {
      super('yml', 'yml');
    }

  };

}).call(this);

//# sourceMappingURL=yaml-generator.js.map
