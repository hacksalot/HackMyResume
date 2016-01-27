
/**
Definition of the FRESHTheme class.
@module core/fresh-theme
@license MIT. See LICENSE.md for details.
 */

(function() {
  var EXTEND, FRESHTheme, FS, HMSTATUS, PATH, READFILES, _, friendlyName, loadExplicit, loadImplicit, loadSafeJson, moment, parsePath, pathExists, validator;

  FS = require('fs');

  validator = require('is-my-json-valid');

  _ = require('underscore');

  PATH = require('path');

  parsePath = require('parse-filepath');

  pathExists = require('path-exists').sync;

  EXTEND = require('extend');

  HMSTATUS = require('./status-codes');

  moment = require('moment');

  loadSafeJson = require('../utils/safe-json-loader');

  READFILES = require('recursive-readdir-sync');


  /*
  The FRESHTheme class is a representation of a FRESH theme
  asset. See also: JRSTheme.
  @class FRESHTheme
   */

  FRESHTheme = (function() {
    function FRESHTheme() {}


    /*
    Open and parse the specified theme.
     */

    FRESHTheme.prototype.open = function(themeFolder) {
      var cached, formatsHash, pathInfo, that, themeFile, themeInfo;
      this.folder = themeFolder;
      pathInfo = parsePath(themeFolder);
      formatsHash = {};
      themeFile = PATH.join(themeFolder, 'theme.json');
      themeInfo = loadSafeJson(themeFile);
      if (themeInfo.ex) {
        throw {
          fluenterror: themeInfo.ex.operation === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError,
          inner: themeInfo.ex.inner
        };
      }
      that = this;
      EXTEND(true, this, themeInfo.json);
      if (this.inherits) {
        cached = {};
        _.each(this.inherits, function(th, key) {
          var d, themePath, themesFolder;
          themesFolder = require.resolve('fresh-themes');
          d = parsePath(themeFolder).dirname;
          themePath = PATH.join(d, th);
          cached[th] = cached[th] || new FRESHTheme().open(themePath);
          return formatsHash[key] = cached[th].getFormat(key);
        });
      }
      if (!!this.formats) {
        formatsHash = loadExplicit.call(this, formatsHash);
        this.explicit = true;
      } else {
        formatsHash = loadImplicit.call(this, formatsHash);
      }
      this.formats = formatsHash;
      this.name = parsePath(this.folder).name;
      return this;
    };


    /* Determine if the theme supports the specified output format. */

    FRESHTheme.prototype.hasFormat = function(fmt) {
      return _.has(this.formats, fmt);
    };


    /* Determine if the theme supports the specified output format. */

    FRESHTheme.prototype.getFormat = function(fmt) {
      return this.formats[fmt];
    };

    return FRESHTheme;

  })();


  /* Load the theme implicitly, by scanning the theme folder for files. TODO:
  Refactor duplicated code with loadExplicit.
   */

  loadImplicit = function(formatsHash) {
    var fmts, major, that, tplFolder;
    that = this;
    major = false;
    tplFolder = PATH.join(this.folder, 'src');
    fmts = READFILES(tplFolder).map(function(absPath) {
      var idx, isMajor, obj, outFmt, pathInfo, portion, reg, res;
      pathInfo = parsePath(absPath);
      outFmt = '';
      isMajor = false;
      portion = pathInfo.dirname.replace(tplFolder, '');
      if (portion && portion.trim()) {
        if (portion[1] === '_') {
          return;
        }
        reg = /^(?:\/|\\)(html|latex|doc|pdf|png|partials)(?:\/|\\)?/ig;
        res = reg.exec(portion);
        if (res) {
          if (res[1] !== 'partials') {
            outFmt = res[1];
          } else {
            that.partials = that.partials || [];
            that.partials.push({
              name: pathInfo.name,
              path: absPath
            });
            return null;
          }
        }
      }
      if (!outFmt) {
        idx = pathInfo.name.lastIndexOf('-');
        outFmt = idx === -1 ? pathInfo.name : pathInfo.name.substr(idx + 1);
        isMajor = true;
      }
      formatsHash[outFmt] = formatsHash[outFmt] || {
        outFormat: outFmt,
        files: []
      };
      obj = {
        action: 'transform',
        path: absPath,
        major: isMajor,
        orgPath: PATH.relative(tplFolder, absPath),
        ext: pathInfo.extname.slice(1),
        title: friendlyName(outFmt),
        pre: outFmt,
        data: FS.readFileSync(absPath, 'utf8'),
        css: null
      };
      formatsHash[outFmt].files.push(obj);
      return obj;
    });
    this.cssFiles = fmts.filter(function(fmt) {
      return fmt && (fmt.ext === 'css');
    });
    this.cssFiles.forEach(function(cssf) {
      var idx;
      idx = _.findIndex(fmts, function(fmt) {
        return fmt && fmt.pre === cssf.pre && fmt.ext === 'html';
      });
      cssf.major = false;
      if (idx > -1) {
        fmts[idx].css = cssf.data;
        return fmts[idx].cssPath = cssf.path;
      } else {
        if (that.inherits) {
          return that.overrides = {
            file: cssf.path,
            data: cssf.data
          };
        }
      }
    });
    return formatsHash;
  };


  /*
  Load the theme explicitly, by following the 'formats' hash
  in the theme's JSON settings file.
   */

  loadExplicit = function(formatsHash) {
    var act, fmts, that, tplFolder;
    tplFolder = PATH.join(this.folder, 'src');
    act = null;
    that = this;
    fmts = READFILES(tplFolder).map(function(absPath) {
      var absPathSafe, idx, obj, outFmt, pathInfo, portion, reg, res;
      act = null;
      pathInfo = parsePath(absPath);
      absPathSafe = absPath.trim().toLowerCase();
      outFmt = _.find(Object.keys(that.formats), function(fmtKey) {
        var fmtVal;
        fmtVal = that.formats[fmtKey];
        return _.some(fmtVal.transform, function(fpath) {
          var absPathB;
          absPathB = PATH.join(that.folder, fpath).trim().toLowerCase();
          return absPathB === absPathSafe;
        });
      });
      if (outFmt) {
        act = 'transform';
      }
      if (!outFmt) {
        portion = pathInfo.dirname.replace(tplFolder, '');
        if (portion && portion.trim()) {
          reg = /^(?:\/|\\)(html|latex|doc|pdf)(?:\/|\\)?/ig;
          res = reg.exec(portion);
          res && (outFmt = res[1]);
        }
      }
      if (!outFmt) {
        idx = pathInfo.name.lastIndexOf('-');
        outFmt = idx === -1 ? pathInfo.name : pathInfo.name.substr(idx + 1);
      }
      formatsHash[outFmt] = formatsHash[outFmt] || {
        outFormat: outFmt,
        files: [],
        symLinks: that.formats[outFmt].symLinks
      };
      obj = {
        action: act,
        orgPath: PATH.relative(that.folder, absPath),
        path: absPath,
        ext: pathInfo.extname.slice(1),
        title: friendlyName(outFmt),
        pre: outFmt,
        data: FS.readFileSync(absPath, 'utf8'),
        css: null
      };
      formatsHash[outFmt].files.push(obj);
      return obj;
    });
    this.cssFiles = fmts.filter(function(fmt) {
      return fmt.ext === 'css';
    });
    this.cssFiles.forEach(function(cssf) {
      var idx;
      idx = _.findIndex(fmts, function(fmt) {
        return fmt.pre === cssf.pre && fmt.ext === 'html';
      });
      fmts[idx].css = cssf.data;
      return fmts[idx].cssPath = cssf.path;
    });
    fmts = fmts.filter(function(fmt) {
      return fmt.ext !== 'css';
    });
    return formatsHash;
  };


  /*
  Return a more friendly name for certain formats.
  TODO: Refactor
   */

  friendlyName = function(val) {
    var friendly;
    val = val.trim().toLowerCase();
    friendly = {
      yml: 'yaml',
      md: 'markdown',
      txt: 'text'
    };
    return friendly[val] || val;
  };

  module.exports = FRESHTheme;

}).call(this);
