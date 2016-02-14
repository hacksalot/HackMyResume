###*
Block helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module helpers/generic-helpers
###



HMSTATUS = require '../core/status-codes'
LO = require 'lodash'
_ = require 'underscore'
unused = require '../utils/string'



###* Block helper function definitions. ###
BlockHelpers = module.exports =



  ###*
  Emit the enclosed content if the resume has a section with
  the specified name. Otherwise, emit an empty string ''.
  ###

  section: ( title, options ) ->
    title = title.trim().toLowerCase()
    obj = LO.get this.r, title
    ret = ''
    if obj
      if _.isArray obj
        if obj.length
          ret = options.fn @
      else if _.isObject obj
        if (obj.history && obj.history.length) || (obj.sets && obj.sets.length)
            ret = options.fn @
    ret



  ###*
  Emit the enclosed content if the resume has the named
  property or subproperty.
  ###

  has: ( title, options ) ->
    title = title && title.trim().toLowerCase()
    if LO.get this.r, title
      return options.fn this
    return



  ###*
  Return true if either value is truthy.
  @method either
  ###
  either: ( lhs, rhs, options ) -> options.fn @ if lhs || rhs    
