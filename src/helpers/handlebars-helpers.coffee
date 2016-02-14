
###*
Template helper definitions for Handlebars.
@license MIT. See LICENSE.md for details.
@module handlebars-helpers.js
###

HANDLEBARS = require 'handlebars'
_ = require 'underscore'
helpers = require './generic-helpers'
blockHelpers = require './block-helpers'

###*
Register useful Handlebars helpers.
@method registerHelpers
###

module.exports = ( theme, opts ) ->

  helpers.theme = theme
  helpers.opts = opts
  helpers.type = 'handlebars'

  wrappedHelpers = _.mapObject helpers, ( hVal, hKey ) ->
    if _.isFunction hVal
      _.wrap hVal, (func) ->
        args = Array.prototype.slice.call arguments
        args.shift() # lose the 1st element (func)
        args.pop() # lose the last element (the Handlebars options hash)
        func.apply @, args
    hVal
  , @
  
  HANDLEBARS.registerHelper wrappedHelpers
  HANDLEBARS.registerHelper blockHelpers
  return
