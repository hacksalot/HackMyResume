/*
Definition of the WordGenerator class.
@module generators/word-generator
@license MIT. See LICENSE.md for details.
*/


const TemplateGenerator = require('./template-generator');

class WordGenerator extends TemplateGenerator {
  constructor() { super('doc', 'xml'); }
}

module.exports = WordGenerator;
