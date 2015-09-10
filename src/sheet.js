/**
Abstract character/resume sheet representation.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {

  var FS = require('fs');

  function Sheet() {
    this.id = null;
    this.title = "New";
    this.rep = { };
    this.fileName = null;
  }

  Sheet.prototype.open = function( file, title ) {
    this.rep = JSON.parse( FS.readFileSync( file, 'utf8' ) );
    this.fileName = file;
    this.title = title || this.rep.basics.name;
    return this;
  };

  module.exports = Sheet;

}());
