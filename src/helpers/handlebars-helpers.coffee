
###*
Template helper definitions for Handlebars.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module handlebars-helpers.js
###

HANDLEBARS = require 'handlebars'
_ = require 'underscore'
helpers = require './generic-helpers'

###*
Register useful Handlebars helpers.
@method registerHelpers
###

module.exports = ( theme, opts ) ->
  helpers.theme = theme
  helpers.opts = opts
  HANDLEBARS.registerHelper helpers
