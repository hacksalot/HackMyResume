(function() {

var FS = require('fs');

function Sheet() {

  this.id = null;
  this.title = "";
  this.sheets = [];
  this.rep = { };

}

Sheet.prototype.open = function( file ) {
  this.rep = JSON.parse( FS.readFileSync( file, 'utf8' ) );
  return this;
};

module.exports = Sheet;

}());
