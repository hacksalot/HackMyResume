
/**
Definition of the JsonYamlGenerator class.
@module generators/json-yaml-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var BaseGenerator, FS, JsonYamlGenerator, YAML,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseGenerator = require('./base-generator');

  FS = require('fs');

  YAML = require('yamljs');


  /**
  JsonYamlGenerator takes a JSON resume object and translates it directly to
  JSON without a template, producing an equivalent YAML-formatted resume. See
  also YamlGenerator (yaml-generator.js).
   */

  module.exports = JsonYamlGenerator = (function(superClass) {
    extend(JsonYamlGenerator, superClass);

    function JsonYamlGenerator() {
      JsonYamlGenerator.__super__.constructor.call(this, 'yml');
    }

    JsonYamlGenerator.prototype.invoke = function(rez, themeMarkup, cssInfo, opts) {
      return YAML.stringify(JSON.parse(rez.stringify()), Infinity, 2);
    };

    JsonYamlGenerator.prototype.generate = function(rez, f, opts) {
      var data;
      data = YAML.stringify(JSON.parse(rez.stringify()), Infinity, 2);
      FS.writeFileSync(f, data, 'utf8');
      return data;
    };

    return JsonYamlGenerator;

  })(BaseGenerator);

}).call(this);

//# sourceMappingURL=json-yaml-generator.js.map
