###*
Definition of the SyntaxErrorEx class.
@module file-contains.js
###

module.exports = ( file, needle ) ->
  require('fs').readFileSync(file,'utf-8').indexOf( needle ) > -1
