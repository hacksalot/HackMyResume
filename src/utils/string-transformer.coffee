###*
Object string transformation.
@module utils/string-transformer
@license MIT. See LICENSE.md for details.
###

_ = require 'underscore'
moment = require 'moment'

###*
Create a copy of this object in which all string fields have been run through
a transformation function (such as a Markdown filter or XML encoder).
###

module.exports = ( ret, filt, transformer ) ->

  that = @

  # TODO: refactor recursion
  transformStringsInObject = ( obj, filters ) ->
    return if !obj
    return if moment.isMoment obj

    if _.isArray( obj )
      obj.forEach (elem, idx, ar) ->
        if typeof elem == 'string' || elem instanceof String
          ar[idx] = transformer( null, elem )
        else if _.isObject(elem)
          transformStringsInObject( elem, filters )
    else if _.isObject( obj )
      Object.keys( obj ).forEach (k) ->
        if filters.length && _.contains(filters, k)
          return
        sub = obj[k]
        if typeof sub == 'string' || sub instanceof String
          obj[k] = transformer( k, sub )
        else if _.isObject( sub )
          transformStringsInObject( sub, filters )

  Object.keys( ret ).forEach (member) ->
    if !filt || !filt.length || !_.contains(filt, member)
      transformStringsInObject( ret[ member ], filt || [] )
  ret
