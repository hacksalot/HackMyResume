/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Block helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module helpers/generic-helpers
*/



const LO = require('lodash');
const _ = require('underscore');
require('../utils/string');



/** Block helper function definitions. */
module.exports = {



  /**
  Emit the enclosed content if the resume has a section with
  the specified name. Otherwise, emit an empty string ''.
  */

  section( title, options ) {
    title = title.trim().toLowerCase();
    const obj = LO.get(this.r, title);
    let ret = '';
    if (obj) {
      if (_.isArray(obj)) {
        if (obj.length) {
          ret = options.fn(this);
        }
      } else if (_.isObject(obj)) {
        if ((obj.history && obj.history.length) || (obj.sets && obj.sets.length)) {
            ret = options.fn(this);
          }
      }
    }
    return ret;
  },



  ifHasSkill( rez, skill, options ) {
    const skUp = skill.toUpperCase();
    const ret = _.some(rez.skills.list, sk => (skUp.toUpperCase() === sk.name.toUpperCase()) && sk.years
    , this);
    if (ret) { return options.fn(this); }
  },


  /**
  Emit the enclosed content if the resume has the named
  property or subproperty.
  */

  has( title, options ) {
    title = title && title.trim().toLowerCase();
    if (LO.get(this.r, title)) {
      return options.fn(this);
    }
  },



  /**
  Return true if either value is truthy.
  @method either
  */
  either( lhs, rhs, options ) { if (lhs || rhs) { return options.fn(this); } }
};
