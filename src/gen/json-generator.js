/**
Definition of the JsonGenerator class.
@license Copyright (c) 2015 | James M. Devlin
*/

var BaseGenerator = require('./base-generator');
var FS = require('fs');
var _ = require('underscore');

/**
The JsonGenerator generates a JSON resume directly.
*/
var JsonGenerator = module.exports = BaseGenerator.extend({

  init: function(){
    this._super( 'json' );
  },

  invoke: function( rez ) {
    // TODO: merge with FCVD
    function replacer( key,value ) { // Exclude these keys from stringification
      return _.some(['meta', 'warnings', 'computed', 'filt', 'ctrl', 'index',
        'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result',
      'isModified', 'htmlPreview'],
        function( val ) { return key.trim() === val; }
      ) ? undefined : value;
    }
    return JSON.stringify( rez, replacer, 2 );
  },

  generate: function( rez, f ) {
    FS.writeFileSync( f, this.invoke(rez), 'utf8' );
  }

});
