###*
Definition of the LaTeXGenerator class.
@module generators/latex-generator
@license MIT. See LICENSE.md for details.
###

TemplateGenerator = require './template-generator'

###*
LaTeXGenerator generates a LaTeX resume via TemplateGenerator.
###
module.exports = class LaTeXGenerator extends TemplateGenerator

  constructor: () -> super 'latex', 'tex'
