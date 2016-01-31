###*
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
###



# Use J. Resig's nifty class implementation
Class = require '../utils/class'
EVENTS = require 'events'
HMEVENT = require '../core/event-codes'



###*
An instantiation of a HackMyResume command.
@class Verb
###
Verb = module.exports = Class.extend



  ###* Constructor. Automatically called at creation. ###
  init: ( moniker, workhorse ) ->
    @moniker = moniker
    @emitter = new EVENTS.EventEmitter()
    @workhorse = workhorse
    return



  ###* Invoke the command. ###
  invoke: ->
    @stat HMEVENT.begin, cmd: @moniker
    ret = @workhorse.apply @, arguments
    @stat HMEVENT.end
    ret



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
    this.fire 'error', payload
    if hot
      throw payload
    true



  ###* Fire the 'hmr:status' error event. ###
  stat: ( subEvent, payload ) ->
    payload = payload || { }
    payload.sub = subEvent
    @fire 'status', payload
    true



  ###* Associate error info with the invocation. ###
  setError: ( code, obj ) ->
    @errorCode = code
    @errorObj = obj
    return
