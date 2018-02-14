
###*
Template helper definitions for Handlebars.
@license MIT. See LICENSE.md for details.
@module handlebars-helpers.js
###

HANDLEBARS = require 'handlebars'
_ = require 'underscore'
helpers = require './generic-helpers'
path = require 'path'
blockHelpers = require './block-helpers'
HMS = require '../core/status-codes'

###*
Register useful Handlebars helpers.
@method registerHelpers
###

module.exports = ( theme, rez, opts ) ->

  helpers.theme = theme
  helpers.opts = opts
  helpers.type = 'handlebars'

  # Prepare generic helpers for use with Handlebars. We do this by wrapping them
  # in a Handlebars-aware wrapper which calls the helper internally.
  wrappedHelpers = _.mapObject helpers, ( hVal, hKey ) ->
    if _.isFunction hVal
      return _.wrap hVal, (func) ->
        args = Array.prototype.slice.call arguments
        args.shift()                  # lose the 1st element (func) [^1]
        #args.pop()                   # lose the last element (HB options hash)
        args[ args.length - 1 ] = rez # replace w/ resume object
        func.apply @, args            # call the generic helper
    hVal
  , @
  HANDLEBARS.registerHelper wrappedHelpers

  # Prepare Handlebars-specific helpers - "blockHelpers" is really a misnomer
  # since any kind of Handlebars-specific helper can live here
  HANDLEBARS.registerHelper blockHelpers

  # Register any theme-provided custom helpers...

  # Normalize "theme.helpers" (string or array) to an array
  theme.helpers = [ theme.helpers ] if _.isString theme.helpers

  if _.isArray theme.helpers
    glob = require 'glob'
    slash = require 'slash'
    curGlob = null
    try
      _.each theme.helpers, (fGlob) ->            # foreach theme.helpers entry
        curGlob = fGlob                           # ..cache in case of exception
        fGlob = path.join theme.folder, fGlob     # ..make relative to theme
        files = glob.sync slash fGlob             # ..expand the glob
        if files.length > 0                       # ..guard against empty glob
          _.each files, (f) ->                    # ..loop over concrete paths
            HANDLEBARS.registerHelper require f   # ..register the path
            return
        else
          throw fluenterror: HMS.themeHelperLoad, inner: er, glob: fGlob
        return
      return
    catch ex
      throw
        fluenterror: HMS.themeHelperLoad
        inner: ex
        glob: curGlob, exit: true
      return

# [^1]: This little bit of acrobatics ensures that our generic helpers are
# called as generic helpers, not as Handlebars-specific helpers. This allows
# them to be used in other templating engines, like Underscore. If you need a
# Handlebars-specific helper with normal Handlebars context and options, put it
# in block-helpers.coffee.
