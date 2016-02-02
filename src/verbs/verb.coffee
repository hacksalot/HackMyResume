###*
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
###



# Use J. Resig's nifty class implementation
Class = require '../utils/class'
EVENTS = require 'events'
HMEVENT = require '../core/event-codes'
Promise = require 'pinkie-promise'



###*
An instantiation of a HackMyResume command.
@class Verb
###
Verb = module.exports = Class.extend



  ###* Constructor. Automatically called at creation. ###
  init: ( moniker, workhorse ) ->
    @moniker = moniker
    @workhorse = workhorse
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
  on: ->
    @emitter.on.apply @emitter, arguments



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
      @reject payload
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



  hasError: -> @errorCode || @errorObj



  ###* Associate error info with the invocation. ###
  setError: ( code, obj ) ->
    @errorCode = code
    @errorObj = obj
    return
