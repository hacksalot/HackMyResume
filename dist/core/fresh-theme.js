
/**
Definition of the FRESHTheme class.
@module core/fresh-theme
@license MIT. See LICENSE.md for details.
 */

(function() {
  var EXTEND, FRESHTheme, FS, HMSTATUS, PATH, READFILES, _, _load, _loadOne, friendlyName, loadSafeJson, moment, parsePath, pathExists, validator;

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


  /* A representation of a FRESH theme asset.
  @class FRESHTheme
   */

  FRESHTheme = (function() {
    function FRESHTheme() {}


    /* Open and parse the specified theme. */

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
      formatsHash = _load.call(this, formatsHash);
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


  /* Load and parse theme source files. */

  _load = function(formatsHash) {
    var copyOnly, fmts, major, that, tplFolder;
    that = this;
    major = false;
    tplFolder = PATH.join(this.folder, 'src');
    copyOnly = ['.ttf', '.otf', '.png', '.jpg', '.jpeg', '.pdf'];
    fmts = READFILES(tplFolder).map(function(absPath) {
      return _loadOne.call(this, absPath, formatsHash, tplFolder);
    }, this);
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


  /* Load a single theme file. */

  _loadOne = function(absPath, formatsHash, tplFolder) {
    var absPathSafe, act, defFormats, idx, isPrimary, obj, outFmt, pathInfo, portion, ref, ref1, reg, res;
    pathInfo = parsePath(absPath);
    absPathSafe = absPath.trim().toLowerCase();
    outFmt = '';
    act = 'copy';
    isPrimary = false;
    if (this.explicit) {
      outFmt = _.find(Object.keys(this.formats), function(fmtKey) {
        var fmtVal;
        fmtVal = this.formats[fmtKey];
        return _.some(fmtVal.transform, function(fpath) {
          var absPathB;
          absPathB = PATH.join(this.folder, fpath).trim().toLowerCase();
          return absPathB === absPathSafe;
        }, this);
      }, this);
      if (outFmt) {
        act = 'transform';
      }
    }
    if (!outFmt) {
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
            if (!this.explicit) {
              act = 'transform';
            }
          } else {
            this.partials = this.partials || [];
            this.partials.push({
              name: pathInfo.name,
              path: absPath
            });
            return null;
          }
        }
      }
    }
    if (!outFmt) {
      idx = pathInfo.name.lastIndexOf('-');
      outFmt = idx === -1 ? pathInfo.name : pathInfo.name.substr(idx + 1);
      if (!this.explicit) {
        act = 'transform';
      }
      defFormats = require('./default-formats');
      isPrimary = _.some(defFormats, function(form) {
        return form.name === outFmt && pathInfo.extname !== '.css';
      });
    }
    formatsHash[outFmt] = formatsHash[outFmt] || {
      outFormat: outFmt,
      files: []
    };
    if ((ref = this.formats) != null ? (ref1 = ref[outFmt]) != null ? ref1.symLinks : void 0 : void 0) {
      formatsHash[outFmt].symLinks = this.formats[outFmt].symLinks;
    }
    obj = {
      action: act,
      primary: isPrimary,
      path: absPath,
      orgPath: PATH.relative(tplFolder, absPath),
      ext: pathInfo.extname.slice(1),
      title: friendlyName(outFmt),
      pre: outFmt,
      data: FS.readFileSync(absPath, 'utf8'),
      css: null
    };
    formatsHash[outFmt].files.push(obj);
    return obj;
  };


  /* Return a more friendly name for certain formats. */

  friendlyName = function(val) {
    var friendly;
    val = (val && val.trim().toLowerCase()) || '';
    friendly = {
      yml: 'yaml',
      md: 'markdown',
      txt: 'text'
    };
    return friendly[val] || val;
  };

  module.exports = FRESHTheme;

}).call(this);

//# sourceMappingURL=fresh-theme.js.map
