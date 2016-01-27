
/**
Definition of the LaTeXGenerator class.
@license MIT. See LICENSE.md for details.
@module generators/latex-generator
 */

(function() {
  var LaTeXGenerator, TemplateGenerator;

  TemplateGenerator = require('./template-generator');


  /**
  LaTeXGenerator generates a LaTeX resume via TemplateGenerator.
   */

  LaTeXGenerator = module.exports = TemplateGenerator.extend({
    init: function() {
      return this._super('latex', 'tex');
    }
  });

}).call(this);
