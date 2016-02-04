
/**
Definition of the BaseGenerator class.
@module generators/base-generator
@license MIT. See LICENSE.md for details.
 */


/**
The BaseGenerator class is the root of the generator hierarchy. Functionality
common to ALL generators lives here.
 */

(function() {
  var BaseGenerator;

  module.exports = BaseGenerator = (function() {

    /** Base-class initialize. */
    function BaseGenerator(format) {
      this.format = format;
    }


    /** Status codes. */

    BaseGenerator.prototype.codes = require('../core/status-codes');


    /** Generator options. */

    BaseGenerator.prototype.opts = {};

    return BaseGenerator;

  })();

}).call(this);

//# sourceMappingURL=base-generator.js.map
