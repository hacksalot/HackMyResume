
/**
Definition of the FRESHTheme class.
@module core/fresh-theme
@license MIT. See LICENSE.md for details.
 */

(function() {
  var EXTEND, FRESHTheme, FS, HMSTATUS, PATH, READFILES, _, _load, friendlyName, loadSafeJson, moment, parsePath, pathExists, validator;

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


  /* Load the theme implicitly, by scanning the theme folder for files. TODO:
  Refactor duplicated code with loadExplicit.
   */

  _load = function(formatsHash) {
    var copyOnly, fmts, major, that, tplFolder;
    that = this;
    major = false;
    tplFolder = PATH.join(this.folder, 'src');
    copyOnly = ['.ttf', '.otf', '.png', '.jpg', '.jpeg', '.pdf'];
    fmts = READFILES(tplFolder).map(function(absPath) {
      var absPathSafe, act, idx, isMajor, obj, outFmt, pathInfo, portion, ref, ref1, reg, res;
      pathInfo = parsePath(absPath);
      absPathSafe = absPath.trim().toLowerCase();
      outFmt = '';
      isMajor = false;
      if (that.formats) {
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
          isMajor = true;
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
      }
      if (!outFmt) {
        idx = pathInfo.name.lastIndexOf('-');
        outFmt = idx === -1 ? pathInfo.name : pathInfo.name.substr(idx + 1);
        isMajor = true;
      }
      act = _.contains(copyOnly, pathInfo.extname) ? 'copy' : 'transform';
      formatsHash[outFmt] = formatsHash[outFmt] || {
        outFormat: outFmt,
        files: []
      };
      if ((ref = that.formats) != null ? (ref1 = ref[outFmt]) != null ? ref1.symLinks : void 0 : void 0) {
        formatsHash[outFmt].symLinks = that.formats[outFmt].symLinks;
      }
      obj = {
        action: act,
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

//# sourceMappingURL=fresh-theme.js.map
