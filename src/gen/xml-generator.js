/**
Definition of the XMLGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module xml-generator.js
*/

var BaseGenerator = require('./base-generator');

/**
The XmlGenerator generates an XML resume via the TemplateGenerator.
*/
var XMLGenerator = module.exports = BaseGenerator.extend({

  init: function(){
    this._super( 'xml' );
  },

});
