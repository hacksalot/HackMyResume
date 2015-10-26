/**
Plain text resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

var TemplateGenerator = require('./template-generator');

/**
The TextGenerator generates a plain-text resume via the TemplateGenerator.
*/
var TextGenerator = TemplateGenerator.extend({

  init: function(){
    this._super( 'txt' );
  },

});

module.exports = TextGenerator;
