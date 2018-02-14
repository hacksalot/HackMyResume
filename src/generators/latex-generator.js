/**
Definition of the LaTeXGenerator class.
@module generators/latex-generator
@license MIT. See LICENSE.md for details.
*/

const TemplateGenerator = require('./template-generator');

/**
LaTeXGenerator generates a LaTeX resume via TemplateGenerator.
*/
class LaTeXGenerator extends TemplateGenerator {

  constructor() { super('latex', 'tex'); }
}

module.exports = LaTeXGenerator;
