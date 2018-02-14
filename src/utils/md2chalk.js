###*
Inline Markdown-to-Chalk conversion routines.
@license MIT. See LICENSE.md for details.
@module utils/md2chalk
###


MD = require 'marked'
CHALK = require 'chalk'
LO = require 'lodash'

module.exports = ( v, style, boldStyle ) ->
  boldStyle = boldStyle || 'bold'
  temp = v.replace(/\*\*(.*?)\*\*/g, LO.get( CHALK, boldStyle )('$1'))
  if style then LO.get( CHALK, style )(temp) else temp
