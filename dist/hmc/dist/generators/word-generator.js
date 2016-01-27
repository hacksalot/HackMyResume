
/*
Definition of the WordGenerator class.
@license MIT. See LICENSE.md for details.
@module generators/word-generator
 */

(function() {
  var TemplateGenerator, WordGenerator;

  TemplateGenerator = require('./template-generator');

  WordGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('doc', 'xml');
    }
  });

}).call(this);
