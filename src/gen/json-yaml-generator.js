/**
Definition of the JsonYamlGenerator class.
@module json-yaml-generator.js
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
*/

(function() {

  var BaseGenerator = require('./base-generator');
  var FS = require('fs');
  var YAML = require('yamljs');

  /**
  JsonYamlGenerator takes a JSON resume object and translates it directly to
  JSON without a template, producing an equivalent YAML-formatted resume. See
  also YamlGenerator (yaml-generator.js).
  */

  var JsonYamlGenerator = module.exports = BaseGenerator.extend({

    init: function(){
      this._super( 'yml' );
    },

    invoke: function( rez, themeMarkup, cssInfo, opts ) {
      return YAML.stringify( JSON.parse( rez.stringify() ), Infinity, 2 );
    },

    generate: function( rez, f, opts ) {
      var data = YAML.stringify( JSON.parse( rez.stringify() ), Infinity, 2 );
      FS.writeFileSync( f, data, 'utf8' );
    }


  });

}());
