
/**
Definition of the JsonGenerator class.
@module generators/json-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var BaseGenerator, FS, JsonGenerator, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseGenerator = require('./base-generator');

  FS = require('fs');

  _ = require('underscore');


  /** The JsonGenerator generates a JSON resume directly. */

  module.exports = JsonGenerator = (function(superClass) {
    extend(JsonGenerator, superClass);

    function JsonGenerator() {
      JsonGenerator.__super__.constructor.call(this, 'json');
    }

    JsonGenerator.prototype.keys = ['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index', 'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result', 'isModified', 'htmlPreview', 'safe'];

    JsonGenerator.prototype.invoke = function(rez) {
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
    };

    JsonGenerator.prototype.generate = function(rez, f) {
      FS.writeFileSync(f, this.invoke(rez), 'utf8');
    };

    return JsonGenerator;

  })(BaseGenerator);

}).call(this);

//# sourceMappingURL=json-generator.js.map
