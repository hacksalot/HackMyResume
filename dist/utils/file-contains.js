(function() {
  /**
  Definition of the SyntaxErrorEx class.
  @module file-contains.js
  */
  module.exports = function(file, needle) {
    return require('fs').readFileSync(file, 'utf-8').indexOf(needle) > -1;
  };

}).call(this);

//# sourceMappingURL=file-contains.js.map
