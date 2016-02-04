###*
Definition of the JsonGenerator class.
@module generators/json-generator
@license MIT. See LICENSE.md for details.
###

BaseGenerator = require './base-generator'
FS = require 'fs'
_ = require 'underscore'

###* The JsonGenerator generates a JSON resume directly. ###

module.exports = class JsonGenerator extends BaseGenerator

  constructor: () -> super 'json'

  keys: ['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
    'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result',
    'isModified', 'htmlPreview', 'safe' ]

  invoke: ( rez ) ->

    # TODO: merge with FCVD
    replacer = ( key,value ) -> # Exclude these keys from stringification
      if (_.some @keys, (val) -> key.trim() == val)
        return undefined
      else
        value
    JSON.stringify rez, replacer, 2

  generate: ( rez, f ) ->
    FS.writeFileSync( f, this.invoke(rez), 'utf8' )
    return
