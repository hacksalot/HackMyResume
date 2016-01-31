###*
Definition of the JRSGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/jrs-generator
###

_ = require('underscore')
HANDLEBARS = require('handlebars')
FS = require('fs')
registerHelpers = require('../helpers/handlebars-helpers')
PATH = require('path')
parsePath = require('parse-filepath')
READFILES = require('recursive-readdir-sync')
SLASH = require('slash')
MD = require('marked')

###*
Perform template-based resume generation for JSON Resume themes.
@class JRSGenerator
###

JRSGenerator = module.exports =

  generate: ( json, jst, format, cssInfo, opts, theme ) ->

    # Disable JRS theme chatter (console.log, console.error, etc.)
    turnoff = ['log', 'error', 'dir'];
    org = turnoff.map (c) ->
      ret = console[c]
      console[c] = () ->
      ret

    # Freeze and render
    rezHtml = theme.render json.harden()

    # Turn logging back on
    turnoff.forEach (c, idx) -> console[c] = org[idx]

    # Unfreeze and apply Markdown
    rezHtml = rezHtml.replace /@@@@~.*?~@@@@/gm, (val) ->
      MDIN( val.replace( /~@@@@/gm,'' ).replace( /@@@@~/gm,'' ) )


MDIN = (txt) -> # TODO: Move this
  MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '')
