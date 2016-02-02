
/**
Definition of the JsonYamlGenerator class.
@module json-yaml-generator.js
@license MIT. See LICENSE.md for details.
 */

(function() {
  var BaseGenerator, FS, JsonYamlGenerator, YAML;

  BaseGenerator = require('./base-generator');

  FS = require('fs');

  YAML = require('yamljs');


  /**
  JsonYamlGenerator takes a JSON resume object and translates it directly to
  JSON without a template, producing an equivalent YAML-formatted resume. See
  also YamlGenerator (yaml-generator.js).
   */

  JsonYamlGenerator = module.exports = BaseGenerator.extend({
    init: function() {
      return this._super('yml');
    },
    invoke: function(rez, themeMarkup, cssInfo, opts) {
      return YAML.stringify(JSON.parse(rez.stringify()), Infinity, 2);
    },
    generate: function(rez, f, opts) {
      var data;
      data = YAML.stringify(JSON.parse(rez.stringify()), Infinity, 2);
      FS.writeFileSync(f, data, 'utf8');
      return data;
    }
  });

}).call(this);

//# sourceMappingURL=json-yaml-generator.js.map
