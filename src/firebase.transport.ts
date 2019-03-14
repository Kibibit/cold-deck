import * as firebase from 'firebase-admin';
import { omit } from 'lodash';
const Transport = require('winston-transport');

export class KbFirebaseTransport extends Transport {
  name: string;
  level: string;
  ref: firebase.database.Reference;
  key: string;

  constructor(options) {
    super(options);

    this.name = options.name || 'FirebaseLogger';
    this.level = options.level || 'silly';
    this.ref = options.ref || 'logs';
    this.key = options.key;
  }

  log(info, callback) {
    const key = info[ this.key ] || Date.now();

    this.ref
      .update({
        [ key ]: {
          level: info.level,
          message: info.message,
          meta: omit(info, [ 'level', 'message', this.key ])
        }
      })
      .then(() => {
        callback(null, true);

        this.emit('logged', info);
      })
      .catch((error) => callback(error));
  }
};
