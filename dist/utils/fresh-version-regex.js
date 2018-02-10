
/**
Defines a regex suitable for matching FRESH versions.
@module file-contains.js
 */

(function() {
  module.exports = function() {
    return RegExp('^(FRESH|FRESCA|JRS)(?:@(\\d+(?:\\.\\d+)?(?:\\.\\d+)?))?$');
  };

}).call(this);

//# sourceMappingURL=fresh-version-regex.js.map
