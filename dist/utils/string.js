
/**
Definitions of string utility functions.
@module utils/string
 */


/**
Determine if the string is null, empty, or whitespace.
See: http://stackoverflow.com/a/32800728/4942583
@method isNullOrWhitespace
 */

(function() {
  String.isNullOrWhitespace = function(input) {
    return !input || !input.trim();
  };

  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  String.is = function(val) {
    return typeof val === 'string' || val instanceof String;
  };

}).call(this);

//# sourceMappingURL=string.js.map
