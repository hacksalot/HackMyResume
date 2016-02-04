
/**
Definition of the XMLGenerator class.
@license MIT. See LICENSE.md for details.
@module generatprs/xml-generator
 */

(function() {
  var BaseGenerator, XMLGenerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseGenerator = require('./base-generator');


  /** The XmlGenerator generates an XML resume via the TemplateGenerator. */

  module.exports = XMLGenerator = (function(superClass) {
    extend(XMLGenerator, superClass);

    function XMLGenerator() {
      XMLGenerator.__super__.constructor.call(this, 'xml');
    }

    return XMLGenerator;

  })(BaseGenerator);

}).call(this);

//# sourceMappingURL=xml-generator.js.map
