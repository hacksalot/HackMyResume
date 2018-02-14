/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the BaseGenerator class.
@module generators/base-generator
@license MIT. See LICENSE.md for details.
*/


/**
The BaseGenerator class is the root of the generator hierarchy. Functionality
common to ALL generators lives here.
*/

let BaseGenerator;
module.exports = (BaseGenerator = (function() {
  BaseGenerator = class BaseGenerator {
    static initClass() {
  
      /** Status codes. */
      this.prototype.codes = require('../core/status-codes');
  
      /** Generator options. */
      this.prototype.opts = { };
    }

    /** Base-class initialize. */
    constructor( format ) {
      this.format = format;
    }
  };
  BaseGenerator.initClass();
  return BaseGenerator;
})());
