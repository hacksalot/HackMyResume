/**
Definition of the LaTeXGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module latex-generator.js
*/

var TemplateGenerator = require('./template-generator');

/**
LaTeXGenerator generates a LaTeX resume via TemplateGenerator.
*/
var LaTeXGenerator = module.exports = TemplateGenerator.extend({

  init: function(){
    this._super( 'latex', 'tex' );
  }

});
