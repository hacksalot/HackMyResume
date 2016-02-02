
/**
Definition of the JsonGenerator class.
@license MIT. See LICENSE.md for details.
@module generators/json-generator
 */

(function() {
  var BaseGenerator, FS, JsonGenerator, _;

  BaseGenerator = require('./base-generator');

  FS = require('fs');

  _ = require('underscore');


  /**
  The JsonGenerator generates a JSON resume directly.
   */

  JsonGenerator = module.exports = BaseGenerator.extend({
    init: function() {
      return this._super('json');
    },
    keys: ['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index', 'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result', 'isModified', 'htmlPreview', 'safe'],
    invoke: function(rez) {
      var replacer;
      replacer = function(key, value) {
        if (_.some(this.keys, function(val) {
          return key.trim() === val;
        })) {
          return void 0;
        } else {
          return value;
        }
      };
      return JSON.stringify(rez, replacer, 2);
    },
    generate: function(rez, f) {
      FS.writeFileSync(f, this.invoke(rez), 'utf8');
    }
  });

}).call(this);

//# sourceMappingURL=json-generator.js.map
