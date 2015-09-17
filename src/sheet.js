/**
Abstract character/resume sheet representation.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {

  var FS = require('fs');
  var extend = require('./extend');

  function Sheet() {
    this.id = null;
    this.title = "New";
    this.rep = { };
    this.fileName = null;
  }

  /**
  Open and parse the specified JSON resume sheet.
  */
  Sheet.prototype.open = function( file, title ) {
    var rep = JSON.parse( FS.readFileSync( file, 'utf8' ) );
    extend( true, this, rep );
    console.log( this );
    this.fileName = file;
    this.title = title || this.basics.name;
    return this;
  };

  /**
  Determine if the sheet includes a specific social profile (eg, GitHub).
  */
  Sheet.prototype.hasProfile = function( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.basics.profiles && this.basics.profiles.filter(function(prof) {
      return prof.network.trim().toLowerCase() === socialNetwork;
    }).length > 0;
  }

  module.exports = Sheet;

}());
