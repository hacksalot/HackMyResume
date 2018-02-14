###*
Definition of the JsonGenerator class.
@module generators/json-generator
@license MIT. See LICENSE.md for details.
###

BaseGenerator = require './base-generator'
FS = require 'fs'
_ = require 'underscore'
FJCV = require 'fresh-jrs-converter'

###* The JsonGenerator generates a FRESH or JRS resume as an output. ###

module.exports = class JsonGenerator extends BaseGenerator

  constructor: () -> super 'json'

  invoke: ( rez ) ->
    altRez = FJCV[ 'to' + if rez.format() == 'FRESH' then 'JRS' else 'FRESH' ] rez
    altRez = FJCV.toSTRING( altRez )
    #altRez.stringify()

  generate: ( rez, f ) ->
    FS.writeFileSync f, @invoke(rez), 'utf8'
    return
