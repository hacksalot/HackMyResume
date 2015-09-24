/**
Abstract character/resume sheet representation.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {

  var FS = require('fs')
    , extend = require('./utils/extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , moment = require('moment');

  /**
  The Sheet class represent a specific JSON character sheet. When Sheet.open
  is called, we merge the loaded JSON sheet properties onto the Sheet instance
  via extend(), so a full-grown sheet object will have all of the methods here,
  plus a complement of JSON properties from the backing JSON file. That allows
  us to treat Sheet objects interchangeably with the loaded JSON model.
  @class Sheet
  */
  function Sheet() {
    this.meta = { };
  }

  /**
  Open and parse the specified JSON resume sheet. Validate any dates present in
  the sheet and convert them to a safe/consistent format. Then sort each section
  on the sheet by startDate descending.
  */
  Sheet.prototype.open = function( file, title ) {
    var rep = JSON.parse( FS.readFileSync( file, 'utf8' ) );
    extend( true, this, rep );
    this.meta.fileName = file;
    this.meta.title = title || this.basics.name;
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
    return this.basics.profiles && _.some( this.basics.profiles, function(p) {
      return p.network.trim().toLowerCase() === socialNetwork;
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
  Validate the sheet against the JSON Resume schema.
  */
  Sheet.prototype.isValid = function( ) {
    var schema = FS.readFileSync( __dirname + '/resume-schema.json', 'utf8' );
    var schemaObj = JSON.parse( schema );
    var validator = require('is-my-json-valid')
    var validate = validator( schemaObj );
    return validate( this );
  };

  /**
  Calculate the total duration of the sheet. Assumes this.work has been sorted
  by start date descending, perhaps via a call to Sheet.sort().
  @returns The total duration of the sheet's work history, that is, the number
  of years between the start date of the earliest job on the resume and the
  *latest end date of all jobs in the work history*. This last condition is for
  sheets that have overlapping jobs.
  */
  Sheet.prototype.duration = function() {
    var careerStart = this.work[ this.work.length - 1].safeStartDate;
    var careerLast = _.max( this.work, function( w ) {
      return w.safeEndDate.unix();
    }).safeEndDate;
    return careerLast.diff( careerStart, 'years' );
  };

  /**
  Sort dated things on the sheet by start date descending.
  */
  Sheet.prototype.sort = function( ) {

    this.work && this.work.sort( byDateDesc );
    this.education && this.education.sort( byDateDesc );
    this.volunteer && this.volunteer.sort( byDateDesc );

    this.awards && this.awards.sort( function(a, b) {
      return( a.safeDate.isBefore(b.safeDate) ) ? 1
        : ( a.safeDate.isAfter(b.safeDate) && -1 ) || 0;
    });
    this.publications && this.publications.sort( function(a, b) {
      return( a.safeReleaseDate.isBefore(b.safeReleaseDate) ) ? 1
        : ( a.safeReleaseDate.isAfter(b.safeReleaseDate) && -1 ) || 0;
    });

    function byDateDesc(a,b) {
      return( a.safeStartDate.isBefore(b.safeStartDate) ) ? 1
        : ( a.safeStartDate.isAfter(b.safeStartDate) && -1 ) || 0;
    }

  };

  /**
  Format a human-friendly FluentCV date to a Moment.js-compatible date. There
  are a few date formats to be aware of here.
  - The words "Present" and "Now", referring to the current date.
  - The default "YYYY-MM-DD" format used in JSON Resume ("2015-02-10").
  - The friendly FluentCV "mmm YYYY" format ("Mar 2015" or "Dec 2008").
  - Year-only "YYYY" ("2015").
  - Any other date format that Moment.js can parse from.
  */
  function _fmt( dt ) {
    dt = dt.toLowerCase().trim();
    if( /\s*(present|now)\s*/i.test(dt) ) { // "Present", "Now"
      return moment();
    }
    else if( /^\D+/.test(dt) ) { // "Mar 2015"
      var parts = dt.split(' ');
      var dt = parts[1] + '-' + (months[parts[0]] || abbr[parts[0]]) + '-01';
      return moment( dt, 'YYYY-MM-DD' );
    }
    else if( /^\d+$/.test(dt) ) { // "2015"
      return moment( dt, 'YYYY' );
    }
    else {
      var mt = moment( dt );
      if(mt.isValid())
        return mt;
      throw 'Invalid date format encountered. Use YYYY-MM-DD.';
    }
  }

  /**
  Convert human-friendly dates into formal Moment.js dates for all collections.
  We don't want to lose the raw textual date as entered by the user, so we store
  the Moment-ified date as a separate property with a prefix of .safe. For ex:
  job.startDate is the date as entered by the user. job.safeStartDate is the
  parsed Moment.js date that we actually use in processing.
  */
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
  moment.months().forEach(function(m,idx){months[m.toLowerCase()]=idx+1;});
  moment.monthsShort().forEach(function(m,idx){abbr[m.toLowerCase()]=idx+1;});
  abbr.sept = 9;

  /**
  Export the Sheet function/ctor.
  */
  module.exports = Sheet;

}());
