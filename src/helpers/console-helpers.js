###*
Generic template helper definitions for command-line output.
@module console-helpers.js
@license MIT. See LICENSE.md for details.
###



PAD   = require 'string-padding'
LO    = require 'lodash'
CHALK = require 'chalk'
_     = require 'underscore'
require '../utils/string'



consoleFormatHelpers = module.exports =

  v: ( val, defaultVal, padding, style ) ->
    retVal = if ( val is null || val is undefined ) then defaultVal else val
    spaces = 0
    if String.is padding
      spaces = parseInt padding, 10
      spaces = 0 if isNaN spaces
    else if _.isNumber padding
      spaces = padding

    if spaces != 0
      retVal = PAD retVal, Math.abs(spaces), null, if spaces > 0 then PAD.LEFT else PAD.RIGHT

    if style && String.is( style )
      retVal = LO.get( CHALK, style )( retVal )
    retVal

  gapLength: (val) ->
    if val < 35
      return CHALK.green.bold val
    else if val < 95
      return CHALK.yellow.bold val
    else
      return CHALK.red.bold val

  style: ( val, style ) ->
    LO.get( CHALK, style )( val )

  isPlural: ( val, options ) ->
    if val > 1
      return options.fn(this)

  pad: ( val, spaces ) ->
    PAD val, Math.abs(spaces), null, if spaces > 0 then PAD.LEFT else PAD.RIGHT
