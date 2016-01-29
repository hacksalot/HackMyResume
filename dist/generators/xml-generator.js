
/**
Definition of the XMLGenerator class.
@license MIT. See LICENSE.md for details.
@module generatprs/xml-generator
 */

(function() {
  var BaseGenerator, XMLGenerator;

  BaseGenerator = require('./base-generator');


  /**
  The XmlGenerator generates an XML resume via the TemplateGenerator.
   */

  XMLGenerator = module.exports = BaseGenerator.extend({
    init: function() {
      return this._super('xml');
    }
  });

}).call(this);
