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

  Sheet.prototype.open = function( file, title ) {
    var rep = JSON.parse( FS.readFileSync( file, 'utf8' ) );
    extend( true, this, rep );
    console.log( this );
    this.fileName = file;
    this.title = title || this.basics.name;
    return this;
  };

  module.exports = Sheet;

}());
