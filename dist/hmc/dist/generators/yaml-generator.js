
/**
Definition of the YAMLGenerator class.
@module yaml-generator.js
@license MIT. See LICENSE.md for details.
 */

(function() {
  var TemplateGenerator, YAMLGenerator;

  TemplateGenerator = require('./template-generator');


  /**
  YamlGenerator generates a YAML-formatted resume via TemplateGenerator.
   */

  YAMLGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('yml', 'yml');
    }
  });

}).call(this);
