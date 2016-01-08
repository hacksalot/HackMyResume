/**
Definition of the MarkdownGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module markdown-generator.js
*/

var TemplateGenerator = require('./template-generator');

/**
MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
*/
var MarkdownGenerator = module.exports = TemplateGenerator.extend({

  init: function(){
    this._super( 'md', 'txt' );
  }

});
