###*
Definition of the BaseGenerator class.
@module generators/base-generator
@license MIT. See LICENSE.md for details.
###


###*
The BaseGenerator class is the root of the generator hierarchy. Functionality
common to ALL generators lives here.
###

module.exports = class BaseGenerator

  ###* Base-class initialize. ###
  constructor: ( @format ) ->

  ###* Status codes. ###
  codes: require '../core/status-codes'

  ###* Generator options. ###
  opts: { }
