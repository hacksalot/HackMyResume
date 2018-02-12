(function() {
  /**
  Definition of the BaseGenerator class.
  @module generators/base-generator
  @license MIT. See LICENSE.md for details.
  */
  var BaseGenerator;

  /**
  The BaseGenerator class is the root of the generator hierarchy. Functionality
  common to ALL generators lives here.
  */
  module.exports = BaseGenerator = (function() {
    class BaseGenerator {
      /** Base-class initialize. */
      constructor(format) {
        this.format = format;
      }

    };

    /** Status codes. */
    BaseGenerator.prototype.codes = require('../core/status-codes');

    /** Generator options. */
    BaseGenerator.prototype.opts = {};

    return BaseGenerator;

  }).call(this);

}).call(this);

//# sourceMappingURL=base-generator.js.map
