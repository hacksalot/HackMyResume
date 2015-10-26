/**
XML resume generator for FluentCV.
@license Copyright (c) 2015 | James M. Devlin
*/

var BaseGenerator = require('./base-generator');

/**
The XmlGenerator generates an XML resume via the TemplateGenerator.
*/
var XmlGenerator = module.exports = BaseGenerator.extend({

  init: function(){
    this._super( 'xml' );
  },

});
