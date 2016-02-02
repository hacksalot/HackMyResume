###*
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
###



EVENTS = require 'events'
HMEVENT = require '../core/event-codes'
Promise = require 'pinkie-promise'



###*
An abstract invokable verb.
Provides base class functionality for verbs. Provide common services such as
error handling, event management, and promise support.
@class Verb
###

module.exports = class Verb



  ###* Constructor. Automatically called at creation. ###
  constructor: ( @moniker, @workhorse ) ->
    @emitter = new EVENTS.EventEmitter()
    return



  ###* Invoke the command. ###
  invoke: ->
    @stat HMEVENT.begin, cmd: @moniker
    argsArray = Array::slice.call arguments
    that = @
    @promise = new Promise (res, rej) ->
      that.resolve = res; that.reject = rej
      that.workhorse.apply that, argsArray; return



  ###* Forward subscriptions to the event emitter. ###
  on: -> @emitter.on.apply @emitter, arguments



  ###* Fire an arbitrary event, scoped to "hmr:". ###
  fire: (evtName, payload) ->
    payload = payload || { }
    payload.cmd = @moniker
    @emitter.emit 'hmr:' + evtName, payload
    true



  ###* Handle an error condition. ###
  err: ( errorCode, payload, hot ) ->
    payload = payload || { }
    payload.sub = payload.fluenterror = errorCode
    payload.throw = hot
    @setError errorCode, payload
    if payload.quit
      @reject errorCode
    @fire 'error', payload
    if hot
      throw payload
    true



  ###* Fire the 'hmr:status' error event. ###
  stat: ( subEvent, payload ) ->
    payload = payload || { }
    payload.sub = subEvent
    @fire 'status', payload
    true



  ###* Has an error occurred during this verb invocation? ###
  hasError: -> @errorCode || @errorObj



  ###* Associate error info with the invocation. ###
  setError: ( code, obj ) ->
    @errorCode = code
    @errorObj = obj
    return
