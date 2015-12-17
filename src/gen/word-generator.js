/**
Definition of the WordGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module word-generator.js
*/

(function() {

  var TemplateGenerator = require('./template-generator');
  var WordGenerator = module.exports = TemplateGenerator.extend({

    init: function(){
      this._super( 'doc', 'xml' );
    }

  });


}());
