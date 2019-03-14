import * as firebase from 'firebase-admin';
import { omit } from 'lodash';

const Transport = require('winston-transport');

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
export class KbFirebaseTransport extends Transport {
  name: string;
  level: string;
  ref: firebase.database.Reference;
  key: string;

  constructor(options) {
    super(options);
    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail, 
    //   logentries, etc.).
    //
    this.name = options.name || 'FirebaseLogger';
    this.level = options.level || 'silly';
    this.ref = options.ref || 'logs';
    this.key = options.key;
  }

  log(info, callback) {
    const key = info[ this.key ] || Date.now();

    this.ref.update({
      [ key ]: {
        level: info.level,
        message: info.message,
        meta: omit(info, [ 'level', 'message', this.key ])
      }
    }, error => {
      if (error) {
        callback(error);
      } else {
        callback(null, true);
        this.emit('logged', info);
      }
    });
  }
};
