###*
Definition of the LaTeXGenerator class.
@license MIT. See LICENSE.md for details.
@module generators/latex-generator
###

TemplateGenerator = require './template-generator'

###*
LaTeXGenerator generates a LaTeX resume via TemplateGenerator.
###
LaTeXGenerator = module.exports = TemplateGenerator.extend

  init: () -> @_super 'latex', 'tex'
