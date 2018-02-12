(function() {
  /**
  Definition of the TextGenerator class.
  @module generators/text-generator
  @license MIT. See LICENSE.md for details.
  */
  var TemplateGenerator, TextGenerator;

  TemplateGenerator = require('./template-generator');

  /**
  The TextGenerator generates a plain-text resume via the TemplateGenerator.
  */
  module.exports = TextGenerator = class TextGenerator extends TemplateGenerator {
    constructor() {
      super('txt');
    }

  };

}).call(this);

//# sourceMappingURL=text-generator.js.map
