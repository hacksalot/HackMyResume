###*
Definitions of string utility functions.
@module utils/string
###

###*
Determine if the string is null, empty, or whitespace.
See: http://stackoverflow.com/a/32800728/4942583
@method isNullOrWhitespace
###


String.isNullOrWhitespace = ( input ) -> !input || !input.trim()
String.prototype.endsWith = (suffix) -> @indexOf(suffix, this.length - suffix.length) != -1
String.is = ( val ) -> typeof val == 'string' || val instanceof String
