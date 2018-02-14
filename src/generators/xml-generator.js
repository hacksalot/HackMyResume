/**
Definition of the XMLGenerator class.
@license MIT. See LICENSE.md for details.
@module generatprs/xml-generator
*/

let XMLGenerator;
const BaseGenerator = require('./base-generator');

/** The XmlGenerator generates an XML resume via the TemplateGenerator. */
module.exports = (XMLGenerator = class XMLGenerator extends BaseGenerator {

  constructor() { super('xml'); }
});
