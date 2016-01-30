###*
Definition of the BaseGenerator class.
@module base-generator.js
@license MIT. See LICENSE.md for details.
###



# Use J. Resig's nifty class implementation
Class = require '../utils/class'



###*
The BaseGenerator class is the root of the generator hierarchy. Functionality
common to ALL generators lives here.
###

BaseGenerator = module.exports = Class.extend

  ###* Base-class initialize. ###
  init: ( outputFormat ) -> @format = outputFormat

  ###* Status codes. ###
  codes: require '../core/status-codes'

  ###* Generator options. ###
  opts: { }
