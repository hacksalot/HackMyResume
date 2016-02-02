
/**
Definition of the YAMLGenerator class.
@module yaml-generator.js
@license MIT. See LICENSE.md for details.
 */

(function() {
  var TemplateGenerator, YAMLGenerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TemplateGenerator = require('./template-generator');


  /**
  YamlGenerator generates a YAML-formatted resume via TemplateGenerator.
   */

  module.exports = YAMLGenerator = (function(superClass) {
    extend(YAMLGenerator, superClass);

    function YAMLGenerator() {
      YAMLGenerator.__super__.constructor.call(this, 'yml', 'yml');
    }

    return YAMLGenerator;

  })(TemplateGenerator);

}).call(this);

//# sourceMappingURL=yaml-generator.js.map
