###*
String helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module helpers/string-helpers
###

_ = require 'lodash'

###* String helper function definitions. ###
StringHelpers = module.exports =

  ###*
  Aligns string to the left. 
  ###

  alignLeft: (str, width = 80, padder = ' ') ->
    padSize = width - str.length + 1
    "#{Array(padSize).join padder}#{str}"

  ###*
  Aligns string to the right
  ###
  alignRight:  (str, width = 80, padder = ' ') ->
    padSize = width - str.length + 1
    "#{str}#{Array(padSize).join padder}"

  ###*
  Aligns string to the center
  ###
  alignCenter: (str, width = 80, padder = ' ') ->
    padSizeRight = (((width - str.length) / 2)|0)+1
    padSizeLeft = width - padSizeRight - str.length  + 2;
    "#{Array(padSizeLeft).join padder}#{str}#{Array(padSizeRight).join padder}"

  wordWrap: (str, width = 80, pad = 0, brk = '\n') ->
    stack = str.split ' '
    lines = ['']
    x = 0
    width = width - pad
    while stack.length > 0
      word = stack[0]
      if lines[x].length + word.length <= width
        if lines[x].length == 0
          lines[x] = word
        else
          lines[x] = "#{lines[x]} #{word}"
      else
        x = x + 1
        lines[x] = word

      stack = _.drop(stack)

    _.reduceRight(lines, (total, line) =>
      "#{Array(pad).join ' '}#{line}#{brk}#{total}"
    , '')

  isString: (str) ->
    str and typeof str == 'string'
