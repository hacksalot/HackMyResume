/**
LaTeX resume generator for FluentCV.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk
*/

var TemplateGenerator = require('./template-generator');

/**
LaTeXGenerator generates a LaTeX resume via TemplateGenerator.
*/
var LaTeXGenerator = module.exports = TemplateGenerator.extend({

  init: function(){
    this._super( 'tex', 'tex' );
  }

});
