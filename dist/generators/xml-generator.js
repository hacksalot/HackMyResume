(function() {
  /**
  Definition of the XMLGenerator class.
  @license MIT. See LICENSE.md for details.
  @module generatprs/xml-generator
  */
  var BaseGenerator, XMLGenerator;

  BaseGenerator = require('./base-generator');

  /** The XmlGenerator generates an XML resume via the TemplateGenerator. */
  module.exports = XMLGenerator = class XMLGenerator extends BaseGenerator {
    constructor() {
      super('xml');
    }

  };

}).call(this);

//# sourceMappingURL=xml-generator.js.map
