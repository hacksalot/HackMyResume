/*
Definition of the WordGenerator class.
@module generators/word-generator
@license MIT. See LICENSE.md for details.
*/


let WordGenerator;
const TemplateGenerator = require('./template-generator');

module.exports = (WordGenerator = class WordGenerator extends TemplateGenerator {

  constructor() { super('doc', 'xml'); }
});
