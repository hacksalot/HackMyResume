(function() {
  /**
  Definition of the JsonYamlGenerator class.
  @module generators/json-yaml-generator
  @license MIT. See LICENSE.md for details.
  */
  var BaseGenerator, FS, JsonYamlGenerator, YAML;

  BaseGenerator = require('./base-generator');

  FS = require('fs');

  YAML = require('yamljs');

  /**
  JsonYamlGenerator takes a JSON resume object and translates it directly to
  JSON without a template, producing an equivalent YAML-formatted resume. See
  also YamlGenerator (yaml-generator.js).
  */
  module.exports = JsonYamlGenerator = class JsonYamlGenerator extends BaseGenerator {
    constructor() {
      super('yml');
    }

    invoke(rez, themeMarkup, cssInfo, opts) {
      return YAML.stringify(JSON.parse(rez.stringify()), 2e308, 2);
    }

    generate(rez, f, opts) {
      var data;
      data = YAML.stringify(JSON.parse(rez.stringify()), 2e308, 2);
      FS.writeFileSync(f, data, 'utf8');
      return data;
    }

  };

}).call(this);

//# sourceMappingURL=json-yaml-generator.js.map
