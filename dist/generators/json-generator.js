
/**
Definition of the JsonGenerator class.
@module generators/json-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var BaseGenerator, FJCV, FS, JsonGenerator, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseGenerator = require('./base-generator');

  FS = require('fs');

  _ = require('underscore');

  FJCV = require('fresh-jrs-converter');


  /** The JsonGenerator generates a FRESH or JRS resume as an output. */

  module.exports = JsonGenerator = (function(superClass) {
    extend(JsonGenerator, superClass);

    function JsonGenerator() {
      JsonGenerator.__super__.constructor.call(this, 'json');
    }

    JsonGenerator.prototype.invoke = function(rez) {
      var altRez;
      altRez = FJCV['to' + (rez.format() === 'FRESH' ? 'JRS' : 'FRESH')](rez);
      return altRez = FJCV.toSTRING(altRez);
    };

    JsonGenerator.prototype.generate = function(rez, f) {
      FS.writeFileSync(f, this.invoke(rez), 'utf8');
    };

    return JsonGenerator;

  })(BaseGenerator);

}).call(this);

//# sourceMappingURL=json-generator.js.map
