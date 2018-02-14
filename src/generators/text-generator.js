/**
Definition of the TextGenerator class.
@module generators/text-generator
@license MIT. See LICENSE.md for details.
*/

const TemplateGenerator = require('./template-generator');

/**
The TextGenerator generates a plain-text resume via the TemplateGenerator.
*/
class TextGenerator extends TemplateGenerator {
  constructor() { super('txt'); }
}

module.exports = TextGenerator;
