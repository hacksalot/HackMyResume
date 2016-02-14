
/**
Implementation of the 'build' verb for HackMyResume.
@module verbs/build
@license MIT. See LICENSE.md for details.
 */

(function() {
  var BuildVerb, FRESHTheme, FS, HMEVENT, HMSTATUS, JRSTheme, MD, MKDIRP, PATH, RConverter, RTYPES, ResumeFactory, Verb, _, _addFreebieFormats, _build, _err, _expand, _fmts, _loadTheme, _log, _opts, _prep, _rezObj, _single, _verifyOutputs, _verifyTheme, addFreebieFormats, build, expand, extend, loadTheme, parsePath, prep, single, verifyOutputs, verifyTheme,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore');

  PATH = require('path');

  FS = require('fs');

  MD = require('marked');

  MKDIRP = require('mkdirp');

  extend = require('extend');

  parsePath = require('parse-filepath');

  RConverter = require('fresh-jrs-converter');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  RTYPES = {
    FRESH: require('../core/fresh-resume'),
    JRS: require('../core/jrs-resume')
  };

  _opts = require('../core/default-options');

  FRESHTheme = require('../core/fresh-theme');

  JRSTheme = require('../core/jrs-theme');

  ResumeFactory = require('../core/resume-factory');

  _fmts = require('../core/default-formats');

  Verb = require('../verbs/verb');

  _err = null;

  _log = null;

  _rezObj = null;

  build = null;

  prep = null;

  single = null;

  verifyOutputs = null;

  addFreebieFormats = null;

  expand = null;

  verifyTheme = null;

  loadTheme = null;


  /** An invokable resume generation command. */

  module.exports = BuildVerb = (function(superClass) {
    extend1(BuildVerb, superClass);


    /** Create a new build verb. */

    function BuildVerb() {
      BuildVerb.__super__.constructor.call(this, 'build', _build);
    }

    return BuildVerb;

  })(Verb);


  /**
  Given a source resume in FRESH or JRS format, a destination resume path, and a
  theme file, generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the target resume file(s).
  @param opts Generation options.
   */

  _build = function(src, dst, opts) {
    var inv, isFRESH, mixed, newEx, orgFormat, problemSheets, results, rez, sheetObjects, sheets, tFolder, targets, theme, toFormat;
    if (!src || !src.length) {
      this.err(HMSTATUS.resumeNotFound, {
        quit: true
      });
      return null;
    }
    _prep.call(this, src, dst, opts);
    sheetObjects = ResumeFactory.load(src, {
      format: null,
      objectify: false,
      quit: true,
      inner: {
        sort: _opts.sort
      }
    }, this);
    problemSheets = _.filter(sheetObjects, function(so) {
      return so.fluenterror;
    });
    if (problemSheets && problemSheets.length) {
      problemSheets[0].quit = true;
      this.err(problemSheets[0].fluenterror, problemSheets[0]);
      return null;
    }
    sheets = sheetObjects.map(function(r) {
      return r.json;
    });
    theme = null;
    this.stat(HMEVENT.beforeTheme, {
      theme: _opts.theme
    });
    try {
      tFolder = _verifyTheme.call(this, _opts.theme);
      if (tFolder.fluenterror) {
        tFolder.quit = true;
        this.err(tFolder.fluenterror, tFolder);
        return;
      }
      theme = _opts.themeObj = _loadTheme(tFolder);
      _addFreebieFormats(theme);
    } catch (_error) {
      newEx = {
        fluenterror: HMSTATUS.themeLoad,
        inner: _error,
        attempted: _opts.theme,
        quit: true
      };
      this.err(HMSTATUS.themeLoad, newEx);
      return null;
    }
    this.stat(HMEVENT.afterTheme, {
      theme: theme
    });
    inv = _verifyOutputs.call(this, dst, theme);
    if (inv && inv.length) {
      this.err(HMSTATUS.invalidFormat, {
        data: inv,
        theme: theme,
        quit: true
      });
      return null;
    }
    rez = null;
    if (sheets.length > 1) {
      isFRESH = !sheets[0].basics;
      mixed = _.any(sheets, function(s) {
        if (isFRESH) {
          return s.basics;
        } else {
          return !s.basics;
        }
      });
      this.stat(HMEVENT.beforeMerge, {
        f: _.clone(sheetObjects),
        mixed: mixed
      });
      if (mixed) {
        this.err(HMSTATUS.mixedMerge);
      }
      rez = _.reduceRight(sheets, function(a, b, idx) {
        return extend(true, b, a);
      });
      this.stat(HMEVENT.afterMerge, {
        r: rez
      });
    } else {
      rez = sheets[0];
    }
    orgFormat = rez.basics ? 'JRS' : 'FRESH';
    toFormat = theme.render ? 'JRS' : 'FRESH';
    if (toFormat !== orgFormat) {
      this.stat(HMEVENT.beforeInlineConvert);
      rez = RConverter['to' + toFormat](rez);
      this.stat(HMEVENT.afterInlineConvert, {
        file: sheetObjects[0].file,
        fmt: toFormat
      });
    }
    this.stat(HMEVENT.applyTheme, {
      r: rez,
      theme: theme
    });
    _rezObj = new RTYPES[toFormat]().parseJSON(rez);
    targets = _expand(dst, theme);
    _.each(targets, function(t) {
      var ref;
      if (this.hasError() && opts.assert) {
        return {};
      }
      t.final = _single.call(this, t, theme, targets);
      if ((ref = t.final) != null ? ref.fluenterror : void 0) {
        t.final.quit = opts.assert;
        this.err(t.final.fluenterror, t.final);
      }
    }, this);
    results = {
      sheet: _rezObj,
      targets: targets,
      processed: targets
    };
    if (this.hasError() && !opts.assert) {
      this.reject(results);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };


  /**
  Prepare for a BUILD run.
   */

  _prep = function(src, dst, opts) {
    var that;
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim()) || 'modern';
    _opts.prettify = opts.prettify === true;
    _opts.css = opts.css;
    _opts.pdf = opts.pdf;
    _opts.wrap = opts.wrap || 60;
    _opts.stitles = opts.sectionTitles;
    _opts.tips = opts.tips;
    _opts.errHandler = opts.errHandler;
    _opts.noTips = opts.noTips;
    _opts.debug = opts.debug;
    _opts.sort = opts.sort;
    that = this;
    _opts.onTransform = function(info) {
      that.stat(HMEVENT.afterTransform, info);
    };
    _opts.beforeWrite = function(info) {
      that.stat(HMEVENT.beforeWrite, info);
    };
    _opts.afterWrite = function(info) {
      that.stat(HMEVENT.afterWrite, info);
    };
    (src.length > 1 && (!dst || !dst.length)) && dst.push(src.pop());
  };


  /**
  Generate a single target resume such as "out/rez.html" or "out/rez.doc".
  TODO: Refactor.
  @param targInfo Information for the target resume.
  @param theme A FRESHTheme or JRSTheme object.
   */

  _single = function(targInfo, theme, finished) {
    var e, ex, f, fName, fType, outFolder, ret, theFormat;
    ret = null;
    ex = null;
    f = targInfo.file;
    try {
      if (!targInfo.fmt) {
        return {};
      }
      fType = targInfo.fmt.outFormat;
      fName = PATH.basename(f, '.' + fType);
      theFormat = null;
      this.stat(HMEVENT.beforeGenerate, {
        fmt: targInfo.fmt.outFormat,
        file: PATH.relative(process.cwd(), f)
      });
      _opts.targets = finished;
      if (targInfo.fmt.files && targInfo.fmt.files.length) {
        theFormat = _fmts.filter(function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];
        MKDIRP.sync(PATH.dirname(f));
        ret = theFormat.gen.generate(_rezObj, f, _opts);
      } else {
        theFormat = _fmts.filter(function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];
        outFolder = PATH.dirname(f);
        MKDIRP.sync(outFolder);
        ret = theFormat.gen.generate(_rezObj, f, _opts);
      }
    } catch (_error) {
      e = _error;
      ex = e;
    }
    this.stat(HMEVENT.afterGenerate, {
      fmt: targInfo.fmt.outFormat,
      file: PATH.relative(process.cwd(), f),
      error: ex
    });
    if (ex) {
      if (ex.fluenterror) {
        ret = ex;
      } else {
        ret = {
          fluenterror: HMSTATUS.generateError,
          inner: ex
        };
      }
    }
    return ret;
  };


  /** Ensure that user-specified outputs/targets are valid. */

  _verifyOutputs = function(targets, theme) {
    this.stat(HMEVENT.verifyOutputs, {
      targets: targets,
      theme: theme
    });
    return _.reject(targets.map(function(t) {
      var pathInfo;
      pathInfo = parsePath(t);
      return {
        format: pathInfo.extname.substr(1)
      };
    }), function(t) {
      return t.format === 'all' || theme.hasFormat(t.format);
    });
  };


  /**
  Reinforce the chosen theme with "freebie" formats provided by HackMyResume.
  A "freebie" format is an output format such as JSON, YML, or PNG that can be
  generated directly from the resume model or from one of the theme's declared
  output formats. For example, the PNG format can be generated for any theme
  that declares an HTML format; the theme doesn't have to provide an explicit
  PNG template.
  @param theTheme A FRESHTheme or JRSTheme object.
   */

  _addFreebieFormats = function(theTheme) {
    theTheme.formats.json = theTheme.formats.json || {
      freebie: true,
      title: 'json',
      outFormat: 'json',
      pre: 'json',
      ext: 'json',
      path: null,
      data: null
    };
    theTheme.formats.yml = theTheme.formats.yml || {
      freebie: true,
      title: 'yaml',
      outFormat: 'yml',
      pre: 'yml',
      ext: 'yml',
      path: null,
      data: null
    };
    if (theTheme.formats.html && !theTheme.formats.png) {
      theTheme.formats.png = {
        freebie: true,
        title: 'png',
        outFormat: 'png',
        ext: 'yml',
        path: null,
        data: null
      };
    }
  };


  /**
  Expand output files. For example, "foo.all" should be expanded to
  ["foo.html", "foo.doc", "foo.pdf", "etc"].
  @param dst An array of output files as specified by the user.
  @param theTheme A FRESHTheme or JRSTheme object.
   */

  _expand = function(dst, theTheme) {
    var destColl, targets;
    destColl = (dst && dst.length && dst) || [PATH.normalize('out/resume.all')];
    targets = [];
    destColl.forEach(function(t) {
      var fmat, pa, to;
      to = PATH.resolve(t);
      pa = parsePath(to);
      fmat = pa.extname || '.all';
      return targets.push.apply(targets, fmat === '.all' ? Object.keys(theTheme.formats).map(function(k) {
        var z;
        z = theTheme.formats[k];
        return {
          file: to.replace(/all$/g, z.outFormat),
          fmt: z
        };
      }) : [
        {
          file: to,
          fmt: theTheme.getFormat(fmat.slice(1))
        }
      ]);
    });
    return targets;
  };


  /**
  Verify the specified theme name/path.
   */

  _verifyTheme = function(themeNameOrPath) {
    var exists, tFolder;
    tFolder = PATH.join(parsePath(require.resolve('fresh-themes')).dirname, '/themes/', themeNameOrPath);
    exists = require('path-exists').sync;
    if (!exists(tFolder)) {
      tFolder = PATH.resolve(themeNameOrPath);
      if (!exists(tFolder)) {
        return {
          fluenterror: HMSTATUS.themeNotFound,
          data: _opts.theme
        };
      }
    }
    return tFolder;
  };


  /**
  Load the specified theme, which could be either a FRESH theme or a JSON Resume
  theme.
   */

  _loadTheme = function(tFolder) {
    var theTheme;
    theTheme = _opts.theme.indexOf('jsonresume-theme-') > -1 ? new JRSTheme().open(tFolder) : new FRESHTheme().open(tFolder);
    _opts.themeObj = theTheme;
    return theTheme;
  };

}).call(this);

//# sourceMappingURL=build.js.map
