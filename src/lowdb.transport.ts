import { mapValues, clone } from 'lodash';
import lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';
import moment from 'moment';
import fs from 'fs-extra';

import { kbDefaultLogLevels } from './consts';

const Transport = require('winston-transport');
export class KbLowDbTransport extends Transport {
  name: string;
  level: string;
  ref: lowdb.LowdbAsync<any>;
  key: string;
  initPromise: Promise<any> = Promise.resolve();
  folder: string;

  constructor(options) {
    super(options);

    this.name = options.name || 'lowdbLogger';
    this.level = options.level || 'silly';
    this.ref = options.ref;
    this.key = options.key;
    this.folder = options.folder || './';
  }

  log(info: any, callback: (...args: any[]) => {}) {
    const key = info[ this.key ] || Date.now();
    const hour = moment.utc().format('HH:00');

    this.db()
      .then(() => this.ref.get('logs').push({ key, ...info }).write())
      .then(() => this.ref.update(`${ hour }.${ info.level }`, n => n + 1).write())
      .then(() => {
        callback(null, true);

        this.emit('logged', info);
      })
      .catch((error) => callback(error));
  }

  private async db() {
    const day = moment.utc().format('YYYY-MM-DD');
    const adapter = new FileAsync(this.folder + `/${ day }.json`);

    return fs.ensureFile(this.folder + `/${ day }.json`)
      .then(() => lowdb(adapter))
      .then((db) => {
        this.ref = db;

        const levelCounters = mapValues(kbDefaultLogLevels.levels, () => 0);

        const hoursOfDay = mapValues({
          '00:00': 0,
          '01:00': 0,
          '02:00': 0,
          '03:00': 0,
          '04:00': 0,
          '05:00': 0,
          '06:00': 0,
          '07:00': 0,
          '08:00': 0,
          '09:00': 0,
          '10:00': 0,
          '11:00': 0,
          '12:00': 0,
          '13:00': 0,
          '14:00': 0,
          '15:00': 0,
          '16:00': 0,
          '17:00': 0,
          '18:00': 0,
          '19:00': 0,
          '20:00': 0,
          '21:00': 0,
          '22:00': 0,
          '23:00': 0
        }, () => clone(levelCounters));

        return this.ref.defaults({ logs: [], ...hoursOfDay }).write();
      })
      .then(() => this.ref);
  }
};
