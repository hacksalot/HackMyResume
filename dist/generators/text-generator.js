
/**
Definition of the TextGenerator class.
@license MIT. See LICENSE.md for details.
@module text-generator.js
 */

(function() {
  var TemplateGenerator, TextGenerator;

  TemplateGenerator = require('./template-generator');


  /**
  The TextGenerator generates a plain-text resume via the TemplateGenerator.
   */

  TextGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('txt');
    }
  });

}).call(this);
