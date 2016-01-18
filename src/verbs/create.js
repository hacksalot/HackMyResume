/**
Implementation of the 'create' verb for HackMyResume.
@module verbs/create
@license MIT. See LICENSE.md for details.
*/



(function(){



  var MKDIRP = require('mkdirp')
    , PATH = require('path')
    , chalk = require('chalk')
    , Verb = require('../verbs/verb')
    , _ = require('underscore')
    , HMSTATUS = require('../core/status-codes')
    , HMEVENT = require('../core/event-codes');



  var CreateVerb = module.exports = Verb.extend({

    init: function() {
      this._super('new');
    },

    invoke: function() {
      this.stat( HMEVENT.begin, { cmd: 'create' });
      create.apply( this, arguments );
      this.stat( HMEVENT.begin, { cmd: 'convert' });
    }

  });



  /**
  Create a new empty resume in either FRESH or JRS format.
  */
  function create( src, dst, opts ) {

    if(!src || !src.length) throw {fluenterror: HMSTATUS.createNameMissing};

    _.each( src, function( t ) {
      var safeFmt = opts.format.toUpperCase();
      this.stat( HMEVENT.beforeCreate, { fmt: safeFmt, file: t } );
      MKDIRP.sync( PATH.dirname( t ) ); // Ensure dest folder exists;
      var RezClass = require('../core/' + safeFmt.toLowerCase() + '-resume' );
      RezClass.default().save(t);
      this.stat( HMEVENT.afterCreate, { fmt: safeFmt, file: t } );
    }, this);

  }



}());
