/**
Implementation of the 'create' verb for HackMyResume.
@module create.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  var MKDIRP = require('mkdirp')
    , PATH = require('path')
    , chalk = require('chalk')
    , Verb = require('../verbs/verb')
    , _ = require('underscore')
    , HACKMYSTATUS = require('../core/status-codes')
    , HME = require('../core/event-codes');



  var CreateVerb = module.exports = Verb.extend({

    init: function() {
      this._super('new');
    },

    invoke: function() {
      create.apply( this, arguments );
    }

  });



  /**
  Create a new empty resume in either FRESH or JRS format.
  */
  function create( src, dst, opts ) {

    if(!src || !src.length) throw {fluenterror: HACKMYSTATUS.createNameMissing};
    this.stat( HME.begin );

    _.each( src, function( t ) {
      var safeFmt = opts.format.toUpperCase();
      this.stat( HME.beforeCreate, { fmt: safeFmt, file: t } );
      MKDIRP.sync( PATH.dirname( t ) ); // Ensure dest folder exists;
      var RezClass = require('../core/' + safeFmt.toLowerCase() + '-resume' );
      RezClass.default().save(t);
      this.stat( HME.afterCreate, { fmt: safeFmt, file: t } );
    }, this);

    this.stat( HME.end );
  }



}());
