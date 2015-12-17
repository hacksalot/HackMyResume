/**
Definition of the YAMLGenerator class.
@module yaml-generator.js
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
*/


(function() {

  var TemplateGenerator = require('./template-generator');

  /**
  YamlGenerator generates a YAML-formatted resume via TemplateGenerator.
  */

  var YAMLGenerator = module.exports = TemplateGenerator.extend({

    init: function(){
      this._super( 'yml', 'yml' );
    }

  });

}());
