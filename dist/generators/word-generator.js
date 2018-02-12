(function() {
  /*
  Definition of the WordGenerator class.
  @module generators/word-generator
  @license MIT. See LICENSE.md for details.
  */
  var TemplateGenerator, WordGenerator;

  TemplateGenerator = require('./template-generator');

  module.exports = WordGenerator = class WordGenerator extends TemplateGenerator {
    constructor() {
      super('doc', 'xml');
    }

  };

}).call(this);

//# sourceMappingURL=word-generator.js.map
