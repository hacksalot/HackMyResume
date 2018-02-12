(function() {
  /**
  Definition of the JsonGenerator class.
  @module generators/json-generator
  @license MIT. See LICENSE.md for details.
  */
  var BaseGenerator, FJCV, FS, JsonGenerator, _;

  BaseGenerator = require('./base-generator');

  FS = require('fs');

  _ = require('underscore');

  FJCV = require('fresh-jrs-converter');

  /** The JsonGenerator generates a FRESH or JRS resume as an output. */
  module.exports = JsonGenerator = class JsonGenerator extends BaseGenerator {
    constructor() {
      super('json');
    }

    invoke(rez) {
      var altRez;
      altRez = FJCV['to' + (rez.format() === 'FRESH' ? 'JRS' : 'FRESH')](rez);
      return altRez = FJCV.toSTRING(altRez);
    }

    //altRez.stringify()
    generate(rez, f) {
      FS.writeFileSync(f, this.invoke(rez), 'utf8');
    }

  };

}).call(this);

//# sourceMappingURL=json-generator.js.map
