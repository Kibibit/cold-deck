import * as winston from 'winston';
import { isNil, map, isString, get, uniqueId } from 'lodash';
import colors from 'colors';
import { blue, bgBlue, bgGreen, green, yellow, red } from 'colors';
import moment from 'moment';
import path from 'path';
import { isObject } from 'util';
import * as admin from "firebase-admin";
import { KbFirebaseTransport } from './firebase.transport';
import { createExpressLogger } from './expressLogger';

const firebaseAppMapper = {};

interface KbLogger extends winston.Logger {
  table?: () => any;
}

interface KbFirebaseOptions extends admin.AppOptions {
  projectId: string;
  collectionName?: string;
}

interface ColdDeckOptions {
  path: string;
  createDefaultConsole: boolean;
  firebase?: KbFirebaseOptions;
}

export interface KbLoggerOptions {
  transports?: any[];
  persist?: boolean;
  scope?: string | { msg: string; colors: string; }
}

const myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
  },
  colors: {
    verbose: bgGreen,
    silly: bgBlue,
    info: blue,
    debug: green,
    warn: yellow,
    error: red
  }
};

const consolePrettyPrint = winston.format.printf(({ level, message, scope, timestamp, tags }) => {
  // console.log('the level is ', myCustomLevels.levels[ level ]);
  const parsedTimestamp = moment(timestamp).format('YYYY-MM-DD [||] HH:mm:ss');
  let parsedLabel = parseScope(scope);
  parsedLabel = parsedLabel ? ` ${ parsedLabel }` : '';

  // console.log('TAGS!', tags);

  const parsedTags = map(tags, (tag) => colors[ tag.colors ](`[${ tag.msg }]`));

  // console.log('parsed tags:');
  // console.log(parsedTags);

  return `${ green(parsedTimestamp) } ${ myCustomLevels.colors[ level ](level.toUpperCase()) }${ parsedLabel }${ parsedTags.length ? ' - ' + parsedTags.join('') : '' }: ${ message }`;

  function parseScope(scope: string | { msg: string; colors: string }) {
    if (isString(scope)) {
      return colors.bgWhite.magenta(`${ scope.toUpperCase() }`);
    }

    if (isObject(scope)) {
      const scopeColors = get(colors, scope.colors) || colors.bgWhite.magenta;

      return scopeColors(`${ scope.msg.toUpperCase() }`);
    }

    return '';
  }
});

const addKeyToInfo = winston.format((info) => {
  info.key = uniqueId(info.timestamp.replace(/\..*$/, '') + `::${ info.scope.msg ? info.scope.msg : info.scope }::`);

  return info;
});

export const kbFormatters = {
  consolePrettyPrint,
  addKeyToInfo
};

const defaultOptions: ColdDeckOptions = {
  path: 'logs',
  createDefaultConsole: true
};

export class ColdDeck {
  // a user can create multiple consoles.
  consoles = [];
  mainConsole;
  globalOptions: ColdDeckOptions;
  firebaseApp: admin.app.App | undefined;

  constructor(options?: Partial<ColdDeckOptions>) {
    options = isNil(options) ? {} : options;

    options = Object.assign({}, defaultOptions, options);

    this.globalOptions = options as ColdDeckOptions;

    const existingDBId = get(this.globalOptions, 'firebase.projectId');
    if (options.firebase && existingDBId && !firebaseAppMapper[ existingDBId ]) {
      firebaseAppMapper[ existingDBId ] = admin.initializeApp(options.firebase, options.firebase.projectId);
      this.firebaseApp = firebaseAppMapper[ existingDBId ];

      console.log('created a firebase app!');
    }
  }

  expressLogger(options?: KbLoggerOptions) {
    return createExpressLogger(this, options);
  }

  child(options: KbLoggerOptions) {
    return this.createBasic(options);
  }

  createBasic(options?: KbLoggerOptions): KbLogger {
    options = options || {};

    const format = winston.format.combine(
      // winston.format.colorize(),
      winston.format.timestamp(),
      kbFormatters.addKeyToInfo(),
      winston.format.json()
    );

    const newLogger: winston.Logger = winston.createLogger({
      level: 'info',
      levels: myCustomLevels.levels,
      format,
      defaultMeta: { scope: options.scope || 'global' },
      transports: options.transports || [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({ filename: path.join(this.globalOptions.path, '/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(this.globalOptions.path, '/combined.log') })
      ]
    });

    // add firebase logger
    if (options.persist && this.firebaseApp) {
      console.log('adding firebase transporter!');
      this.initializeFirebase(newLogger);
    }

    // winston.addColors(myCustomLevels.colors);

    if (process.env.NODE_ENV !== 'production') {
      const consoleTransport = new winston.transports.Console({
        format: kbFormatters.consolePrettyPrint
      });

      newLogger.add(consoleTransport);
    }

    this.mainConsole = this.mainConsole || newLogger;

    // add a table option:
    (newLogger as KbLogger).table = () => { };
    const kbLogger: KbLogger = newLogger as KbLogger;



    return kbLogger;
  }

  initializeFirebase(logger: winston.Logger) {
    if (!this.firebaseApp || !this.globalOptions.firebase) { return; }

    const db = this.firebaseApp.database();

    let collectionName = this.globalOptions.firebase.collectionName || 'application-logs';
    collectionName = collectionName.endsWith('-logs') ? collectionName : `${ collectionName }-logs`;

    // @ts-ignore
    logger.add(new KbFirebaseTransport({
      ref: db.ref(collectionName),
      key: 'key'
    }));
  }
}
