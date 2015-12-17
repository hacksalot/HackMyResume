/**
Definition of the TextGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module text-generator.js
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
