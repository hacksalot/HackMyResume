/**
Definition of the Verb class.
@module verb.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  // Use J. Resig's nifty class implementation
  var Class = require( '../utils/class' )
    , EVENTS = require('events');




  /**
  An instantiation of a HackMyResume command.
  @class Verb
  */
  var Verb = module.exports = Class.extend({

    init: function( moniker ) {
      this.moniker = moniker;
      this.emitter = new EVENTS.EventEmitter();
    },

    on: function() {
      this.emitter.on.apply( this.emitter, arguments );
    },

    fire: function(evtName, payload) {
      payload = payload || { };
      payload.cmd = this.moniker;
      this.emitter.emit( 'hmr:' + evtName, payload );
      return true;
    },

    stat: function( subEvent, payload ) {
      payload = payload || { };
      payload.cmd = this.moniker;
      payload.sub = subEvent;
      this.emitter.emit( 'hmr:status', payload );
      return true;
    }

  });

}());
