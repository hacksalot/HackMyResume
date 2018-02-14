/**
Definition of the TextGenerator class.
@module generators/text-generator
@license MIT. See LICENSE.md for details.
*/

let TextGenerator;
const TemplateGenerator = require('./template-generator');

/**
The TextGenerator generates a plain-text resume via the TemplateGenerator.
*/
module.exports = (TextGenerator = class TextGenerator extends TemplateGenerator {

  constructor() { super('txt'); }
});
