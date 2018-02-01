
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

  # Register any theme-provided custom helpers...

  # Normalize "theme.helpers" (string or array) to an array
  theme.helpers = [ theme.helpers ] if _.isString theme.helpers

  if _.isArray theme.helpers
    glob = require 'glob'
    curGlob = null
    try
      _.each theme.helpers, (fGlob) ->            # foreach theme.helpers entry
        curGlob = fGlob                           #   cache in case of exception
        fGlob = path.join theme.folder, fGlob     #   make relative to theme
        glob fGlob, { }, (er, files) ->           #   expand the glob to paths
          if er is null and files.length > 0      #   guard against the error
            _.each files, (f) ->                  #   loop over concrete paths
              HANDLEBARS.registerHelper require f #     register the path
              return
          # else if er                              # glob error occurred
          #   throw fluenterror: HMS.themeHelperLoad, inner: er, glob: fGlob
          # else if files.length < 1                # glob returned no results
          #   throw fluenterror: HMS.themeHelperLoad
          return
        return
      return
    catch ex
      # If a non-path is passed to glob() it will throw an error
      throw fluenterror: HMS.themeHelperLoad, inner: ex, glob: curGlob, exit: true
      return
