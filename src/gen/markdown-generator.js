/**
Markdown resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

var TemplateGenerator = require('./template-generator');

/**
MarkdownGenerator generates a Markdown-formatted resume via TemplateGenerator.
*/
var MarkdownGenerator = module.exports = TemplateGenerator.extend({

  init: function(){
    this._super( 'md' );
  }

});
