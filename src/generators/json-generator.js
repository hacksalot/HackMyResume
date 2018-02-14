/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the JsonGenerator class.
@module generators/json-generator
@license MIT. See LICENSE.md for details.
*/

const BaseGenerator = require('./base-generator');
const FS = require('fs');
const FJCV = require('fresh-jrs-converter');

/** The JsonGenerator generates a FRESH or JRS resume as an output. */

class JsonGenerator extends BaseGenerator {

  constructor() { super('json'); }

  invoke( rez ) {
    let altRez = FJCV[ `to${rez.format() === 'FRESH' ? 'JRS' : 'FRESH'}` ](rez);
    return altRez = FJCV.toSTRING( altRez );
  }
    //altRez.stringify()

  generate( rez, f ) {
    FS.writeFileSync(f, this.invoke(rez), 'utf8');
  }
}

module.exports = JsonGenerator;
