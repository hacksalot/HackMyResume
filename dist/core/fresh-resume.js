
/**
Definition of the FRESHResume class.
@license MIT. See LICENSE.md for details.
@module core/fresh-resume
 */

(function() {
  var AbstractResume, CONVERTER, FS, FluentDate, FreshResume, JRSResume, MD, PATH, XML, _, __, _parseDates, extend, moment, validator,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  FS = require('fs');

  extend = require('extend');

  validator = require('is-my-json-valid');

  _ = require('underscore');

  __ = require('lodash');

  PATH = require('path');

  moment = require('moment');

  XML = require('xml-escape');

  MD = require('marked');

  CONVERTER = require('fresh-jrs-converter');

  JRSResume = require('./jrs-resume');

  FluentDate = require('./fluent-date');

  AbstractResume = require('./abstract-resume');


  /**
  A FRESH resume or CV. FRESH resumes are backed by JSON, and each FreshResume
  object is an instantiation of that JSON decorated with utility methods.
  @constructor
   */

  FreshResume = (function(superClass) {
    extend1(FreshResume, superClass);

    function FreshResume() {
      return FreshResume.__super__.constructor.apply(this, arguments);
    }


    /** Initialize the the FreshResume from JSON string data. */

    FreshResume.prototype.parse = function(stringData, opts) {
      var ref;
      this.imp = (ref = this.imp) != null ? ref : {
        raw: stringData
      };
      return this.parseJSON(JSON.parse(stringData), opts);
    };


    /**
    Initialize the FreshResume from JSON.
    Open and parse the specified FRESH resume. Merge the JSON object model onto
    this Sheet instance with extend() and convert sheet dates to a safe &
    consistent format. Then sort each section by startDate descending.
    @param rep {Object} The raw JSON representation.
    @param opts {Object} Resume loading and parsing options.
    {
      date: Perform safe date conversion.
      sort: Sort resume items by date.
      compute: Prepare computed resume totals.
    }
     */

    FreshResume.prototype.parseJSON = function(rep, opts) {
      var ignoreList, ref, scrubbed, that, traverse;
      that = this;
      traverse = require('traverse');
      ignoreList = [];
      scrubbed = traverse(rep).map(function(x) {
        if (!this.isLeaf && this.node.ignore) {
          if (this.node.ignore === true || this.node.ignore === 'true') {
            ignoreList.push(this.node);
            return this.remove();
          }
        }
      });
      extend(true, this, scrubbed);
      if (!((ref = this.imp) != null ? ref.processed : void 0)) {
        opts = opts || {};
        if (opts.imp === void 0 || opts.imp) {
          this.imp = this.imp || {};
          this.imp.title = (opts.title || this.imp.title) || this.name;
          if (!this.imp.raw) {
            this.imp.raw = JSON.stringify(rep);
          }
        }
        this.imp.processed = true;
        (opts.date === void 0 || opts.date) && _parseDates.call(this);
        (opts.sort === void 0 || opts.sort) && this.sort();
        (opts.compute === void 0 || opts.compute) && (this.computed = {
          numYears: this.duration(),
          keywords: this.keywords()
        });
      }
      return this;
    };


    /** Save the sheet to disk (for environments that have disk access). */

    FreshResume.prototype.save = function(filename) {
      this.imp.file = filename || this.imp.file;
      FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');
      return this;
    };


    /**
    Save the sheet to disk in a specific format, either FRESH or JSON Resume.
     */

    FreshResume.prototype.saveAs = function(filename, format) {
      var newRep;
      if (format !== 'JRS') {
        this.imp.file = filename || this.imp.file;
        FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');
      } else {
        newRep = CONVERTER.toJRS(this);
        FS.writeFileSync(filename, JRSResume.stringify(newRep), 'utf8');
      }
      return this;
    };


    /**
    Duplicate this FreshResume instance.
    This method first extend()s this object onto an empty, creating a deep copy,
    and then passes the result into a new FreshResume instance via .parseJSON.
    We do it this way to create a true clone of the object without re-running any
    of the associated processing.
     */

    FreshResume.prototype.dupe = function() {
      var jso, rnew;
      jso = extend(true, {}, this);
      rnew = new FreshResume();
      rnew.parseJSON(jso, {});
      return rnew;
    };


    /**
    Convert this object to a JSON string, sanitizing meta-properties along the
    way.
     */

    FreshResume.prototype.stringify = function() {
      return FreshResume.stringify(this);
    };


    /**
    Create a copy of this resume in which all string fields have been run through
    a transformation function (such as a Markdown filter or XML encoder).
    TODO: Move this out of FRESHResume.
     */

    FreshResume.prototype.transformStrings = function(filt, transformer) {
      var ret, trx;
      ret = this.dupe();
      trx = require('../utils/string-transformer');
      return trx(ret, filt, transformer);
    };


    /**
    Create a copy of this resume in which all fields have been interpreted as
    Markdown.
     */

    FreshResume.prototype.markdownify = function() {
      var MDIN, trx;
      MDIN = function(txt) {
        return MD(txt || '').replace(/^\s*<p>|<\/p>\s*$/gi, '');
      };
      trx = function(key, val) {
        if (key === 'summary') {
          return MD(val);
        }
        return MDIN(val);
      };
      return this.transformStrings(['skills', 'url', 'start', 'end', 'date'], trx);
    };


    /**
    Create a copy of this resume in which all fields have been interpreted as
    Markdown.
     */

    FreshResume.prototype.xmlify = function() {
      var trx;
      trx = function(key, val) {
        return XML(val);
      };
      return this.transformStrings([], trx);
    };


    /** Return the resume format. */

    FreshResume.prototype.format = function() {
      return 'FRESH';
    };


    /**
    Return internal metadata. Create if it doesn't exist.
     */

    FreshResume.prototype.i = function() {
      return this.imp = this.imp || {};
    };


    /** Return a unique list of all keywords across all skills. */

    FreshResume.prototype.keywords = function() {
      var flatSkills;
      flatSkills = [];
      if (this.skills) {
        if (this.skills.sets) {
          flatSkills = this.skills.sets.map(function(sk) {
            return sk.skills;
          }).reduce(function(a, b) {
            return a.concat(b);
          });
        } else if (this.skills.list) {
          flatSkills = flatSkills.concat(this.skills.list.map(function(sk) {
            return sk.name;
          }));
        }
        flatSkills = _.uniq(flatSkills);
      }
      return flatSkills;
    };


    /**
    Reset the sheet to an empty state. TODO: refactor/review
     */

    FreshResume.prototype.clear = function(clearMeta) {
      clearMeta = ((clearMeta === void 0) && true) || clearMeta;
      if (clearMeta) {
        delete this.imp;
      }
      delete this.computed;
      delete this.employment;
      delete this.service;
      delete this.education;
      delete this.recognition;
      delete this.reading;
      delete this.writing;
      delete this.interests;
      delete this.skills;
      return delete this.social;
    };


    /**
    Get a safe count of the number of things in a section.
     */

    FreshResume.prototype.count = function(obj) {
      if (!obj) {
        return 0;
      }
      if (obj.history) {
        return obj.history.length;
      }
      if (obj.sets) {
        return obj.sets.length;
      }
      return obj.length || 0;
    };


    /** Add work experience to the sheet. */

    FreshResume.prototype.add = function(moniker) {
      var defSheet, newObject;
      defSheet = FreshResume["default"]();
      newObject = defSheet[moniker].history ? $.extend(true, {}, defSheet[moniker].history[0]) : moniker === 'skills' ? $.extend(true, {}, defSheet.skills.sets[0]) : $.extend(true, {}, defSheet[moniker][0]);
      this[moniker] = this[moniker] || [];
      if (this[moniker].history) {
        this[moniker].history.push(newObject);
      } else if (moniker === 'skills') {
        this.skills.sets.push(newObject);
      } else {
        this[moniker].push(newObject);
      }
      return newObject;
    };


    /**
    Determine if the sheet includes a specific social profile (eg, GitHub).
     */

    FreshResume.prototype.hasProfile = function(socialNetwork) {
      socialNetwork = socialNetwork.trim().toLowerCase();
      return this.social && _.some(this.social, function(p) {
        return p.network.trim().toLowerCase() === socialNetwork;
      });
    };


    /** Return the specified network profile. */

    FreshResume.prototype.getProfile = function(socialNetwork) {
      socialNetwork = socialNetwork.trim().toLowerCase();
      return this.social && _.find(this.social, function(sn) {
        return sn.network.trim().toLowerCase() === socialNetwork;
      });
    };


    /**
    Return an array of profiles for the specified network, for when the user
    has multiple eg. GitHub accounts.
     */

    FreshResume.prototype.getProfiles = function(socialNetwork) {
      socialNetwork = socialNetwork.trim().toLowerCase();
      return this.social && _.filter(this.social, function(sn) {
        return sn.network.trim().toLowerCase() === socialNetwork;
      });
    };


    /** Determine if the sheet includes a specific skill. */

    FreshResume.prototype.hasSkill = function(skill) {
      skill = skill.trim().toLowerCase();
      return this.skills && _.some(this.skills, function(sk) {
        return sk.keywords && _.some(sk.keywords, function(kw) {
          return kw.trim().toLowerCase() === skill;
        });
      });
    };


    /** Validate the sheet against the FRESH Resume schema. */

    FreshResume.prototype.isValid = function(info) {
      var ret, schemaObj, validate;
      schemaObj = require('fresca');
      validator = require('is-my-json-valid');
      validate = validator(schemaObj, {
        formats: {
          date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
        }
      });
      ret = validate(this);
      if (!ret) {
        this.imp = this.imp || {};
        this.imp.validationErrors = validate.errors;
      }
      return ret;
    };

    FreshResume.prototype.duration = function(unit) {
      return FreshResume.__super__.duration.call(this, 'employment.history', 'start', 'end', unit);
    };


    /**
    Sort dated things on the sheet by start date descending. Assumes that dates
    on the sheet have been processed with _parseDates().
     */

    FreshResume.prototype.sort = function() {
      var byDateDesc, sortSection;
      byDateDesc = function(a, b) {
        if (a.safe.start.isBefore(b.safe.start)) {
          return 1;
        } else {
          if (a.safe.start.isAfter(b.safe.start)) {
            return -1;
          } else {
            return 0;
          }
        }
      };
      sortSection = function(key) {
        var ar, datedThings;
        ar = __.get(this, key);
        if (ar && ar.length) {
          datedThings = obj.filter(function(o) {
            return o.start;
          });
          return datedThings.sort(byDateDesc);
        }
      };
      sortSection('employment.history');
      sortSection('education.history');
      sortSection('service.history');
      sortSection('projects');
      return this.writing && this.writing.sort(function(a, b) {
        if (a.safe.date.isBefore(b.safe.date)) {
          return 1;
        } else {
          return (a.safe.date.isAfter(b.safe.date) && -1) || 0;
        }
      });
    };

    return FreshResume;

  })(AbstractResume);


  /**
  Get the default (starter) sheet.
   */

  FreshResume["default"] = function() {
    return new FreshResume().parseJSON(require('fresh-resume-starter').fresh);
  };


  /**
  Convert the supplied FreshResume to a JSON string, sanitizing meta-properties
  along the way.
   */

  FreshResume.stringify = function(obj) {
    var replacer;
    replacer = function(key, value) {
      var exKeys;
      exKeys = ['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index', 'safe', 'result', 'isModified', 'htmlPreview', 'display_progress_bar'];
      if (_.some(exKeys, function(val) {
        return key.trim() === val;
      })) {
        return void 0;
      } else {
        return value;
      }
    };
    return JSON.stringify(obj, replacer, 2);
  };


  /**
  Convert human-friendly dates into formal Moment.js dates for all collections.
  We don't want to lose the raw textual date as entered by the user, so we store
  the Moment-ified date as a separate property with a prefix of .safe. For ex:
  job.startDate is the date as entered by the user. job.safeStartDate is the
  parsed Moment.js date that we actually use in processing.
   */

  _parseDates = function() {
    var _fmt, replaceDatesInObject, that;
    _fmt = require('./fluent-date').fmt;
    that = this;
    replaceDatesInObject = function(obj) {
      if (!obj) {
        return;
      }
      if (Object.prototype.toString.call(obj) === '[object Array]') {
        obj.forEach(function(elem) {
          return replaceDatesInObject(elem);
        });
      } else if (typeof obj === 'object') {
        if (obj._isAMomentObject || obj.safe) {
          return;
        }
        Object.keys(obj).forEach(function(key) {
          return replaceDatesInObject(obj[key]);
        });
        ['start', 'end', 'date'].forEach(function(val) {
          if ((obj[val] !== void 0) && (!obj.safe || !obj.safe[val])) {
            obj.safe = obj.safe || {};
            obj.safe[val] = _fmt(obj[val]);
            if (obj[val] && (val === 'start') && !obj.end) {
              obj.safe.end = _fmt('current');
            }
          }
        });
      }
    };
    Object.keys(this).forEach(function(member) {
      replaceDatesInObject(that[member]);
    });
  };


  /** Export the Sheet function/ctor. */

  module.exports = FreshResume;

}).call(this);

//# sourceMappingURL=fresh-resume.js.map
