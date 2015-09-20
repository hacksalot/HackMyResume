/**
Abstract character/resume sheet representation.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {

  var FS = require('fs')
    , extend = require('./extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , moment = require('moment');

  /**
  Initialize a new Sheet instance.
  */
  function Sheet() {
    this.id = null;
    this.title = "New";
    this.fileName = null;
  }

  /**
  Open and parse the specified JSON resume sheet.
  */
  Sheet.prototype.open = function( file, title ) {
    var rep = JSON.parse( FS.readFileSync( file, 'utf8' ) );
    extend( true, this, rep );
    this.fileName = file;
    this.title = title || this.basics.name;
    _parseDates.call( this );
    this.sort();
    this.computed = this.computed || { };
    this.computed.numYears = this.duration();
    return this;
  };

  /**
  Determine if the sheet includes a specific social profile (eg, GitHub).
  */
  Sheet.prototype.hasProfile = function( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.basics.profiles && _.some( this.basics.profiles, function(prof) {
      return prof.network.trim().toLowerCase() === socialNetwork;
    });
  };

  /**
  Determine if the sheet includes a specific skill.
  */
  Sheet.prototype.hasSkill = function( skill ) {
    skill = skill.trim().toLowerCase();
    return this.skills && _.some( this.skills, function(sk) {
      return sk.keywords && _.some( sk.keywords, function(kw) {
        return kw.trim().toLowerCase() === skill;
      });
    });
  };

  /**
  Validate the sheet against a specific JSON schema.
  */
  Sheet.prototype.isValid = function( ) {
    var schemaObj = JSON.parse( FS.readFileSync( __dirname + '/resume-schema.json', 'utf8' ) );
    var validator = require('is-my-json-valid')
    var validate = validator( schemaObj );
    return validate( this );
  };

  /**
  Calculate the total duration of the sheet. Assumes this.work has been sorted
  by start date descending.
  */
  Sheet.prototype.duration = function() {
    var careerStart = _fmt( this.work[ this.work.length - 1].startDate );
    var careerLast = _fmt( _.max( this.work, function( w ) {
      return _fmt( w.endDate ).unix();
    }).endDate );
    return careerLast.diff( careerStart, 'years' );
  };

  /**
  Sort dated things by start date descending.
  */
  Sheet.prototype.sort = function( ) {
    var da, db;
    if( this.work && this.work.length > 1 ) {
      this.work.sort( function(a, b) {
        return( a.safeStartDate.isBefore(b.safeStartDate) ) ? 1 : ( a.safeStartDate.isAfter(b.safeStartDate) && -1 ) || 0;
      });
    }
    if( this.education && this.education.length > 1 ) {
      this.education.sort( function(a, b) {
        return( a.safeStartDate.isBefore(b.safeStartDate) ) ? 1 : ( a.safeStartDate.isAfter(b.safeStartDate) && -1 ) || 0;
      });
    }
    if( this.volunteer && this.volunteer.length > 1 ) {
      this.volunteer.sort( function(a, b) {
        return( a.safeStartDate.isBefore(b.safeStartDate) ) ? 1 : ( a.safeStartDate.isAfter(b.safeStartDate) && -1 ) || 0;
      });
    }
    if( this.awards && this.awards.length > 1 ) {
      this.awards.sort( function(a, b) {
        return( a.safeDate.isBefore(b.safeDate) ) ? 1 : ( a.safeDate.isAfter(b.safeDate) && -1 ) || 0;
      });
    }
    if( this.publications && this.publications.length > 1 ) {
      this.publications.sort( function(a, b) {
        return( a.safeReleaseDate.isBefore(b.safeReleaseDate) ) ? 1 : ( a.safeReleaseDate.isAfter(b.safeReleaseDate) && -1 ) || 0;
      });
    }
  };

  /**
  Format a human-friendly FluentCV date to a Moment.js-compatible date.
  */
  function _fmt( dt ) {
    dt = dt.toLowerCase().trim();
    if( dt === 'present' ) {
      return moment();
    }
    else if( /^\D+/.test(dt) ) {
      var parts = dt.split(' ');
      return moment( parts[1] + '-' + (months[ parts[0] ] || abbr[ parts[0] ] || ( parts[0] === 'sept' && '09' )) + '-' + '01', 'YYYY-MM-DD' );
    }
    else {
      var mt = moment( dt );
      if(mt.isValid())
        return mt;
      throw 'Invalid date format encountered. Use YYYY-MM-DD.';
    }
  }

  function _parseDates() {
    this.work.forEach( function(job) {
      job.safeStartDate = _fmt( job.startDate );
      job.safeEndDate = _fmt( job.endDate );
    });
    this.education.forEach( function(edu) {
      edu.safeStartDate = _fmt( edu.startDate );
      edu.safeEndDate = _fmt( edu.endDate );
    });
    this.volunteer.forEach( function(vol) {
      vol.safeStartDate = _fmt( vol.startDate );
      vol.safeEndDate = _fmt( vol.endDate );
    });
    this.awards.forEach( function(awd) {
      awd.safeDate = _fmt( awd.date );
    });
    this.publications.forEach( function(pub) {
      pub.safeReleaseDate = _fmt( pub.releaseDate );
    });
  }

  var months = {}, abbr = {};
  moment.months().forEach( function(m, idx) { months[ m.toLowerCase() ] = idx + 1; });
  moment.monthsShort().forEach( function(m, idx) { abbr[ m.toLowerCase() ] = idx + 1; });

  /**
  Export the Sheet function/ctor.
  */
  module.exports = Sheet;

}());
