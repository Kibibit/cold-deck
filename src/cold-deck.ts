import * as admin from 'firebase-admin';
import { get, isNil } from 'lodash';
import path from 'path';
import * as winston from 'winston';

import { coldDeckDefaultOptions, firebaseAppMapper, kbDefaultLogLevels, kbFormatters } from './consts';
import { createExpressLogger } from './expressLogger';
import { KbFirebaseTransport } from './firebase.transport';
import { KbColdDeckOptions, KbLogger, KbLoggerOptions } from './interfaces';

export class ColdDeck {
  /* All the loggers created with cold deck. holds all child loggers */
  static consoles = [];
  /* A Pointer to the main logger created with cold deck. */
  static mainConsole: ColdDeck;
  /* holds the global options inherited by all child loggers */
  globalOptions: KbColdDeckOptions;
  /* if logs should be backed up to a firebase DB, this will hold the firebase app instance */
  firebaseApp: admin.app.App | undefined;

  constructor(options?: Partial<KbColdDeckOptions>) {
    options = isNil(options) ? {} : options;

    options = Object.assign({}, coldDeckDefaultOptions, options);

    this.globalOptions = options as KbColdDeckOptions;

    const existingDBId = get(this.globalOptions, 'firebase.projectId');
    if (options.firebase && existingDBId && !firebaseAppMapper[ existingDBId ]) {
      firebaseAppMapper[ existingDBId ] = admin.initializeApp(options.firebase, options.firebase.projectId);
      this.firebaseApp = firebaseAppMapper[ existingDBId ];
    }
  }

  /**
   * Get the express logger to attach as an express middleware
   */
  expressLogger(options?: KbLoggerOptions) {
    return createExpressLogger(this, options);
  }

  /**
   * Create a new child logger based on this instance of ColdDeck
   */
  child(options: KbLoggerOptions) {
    return this.createBasic(options);
  }

  /**
   * Create a basic logger that will act as the main logger
   */
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
      levels: kbDefaultLogLevels.levels,
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

    // this.mainConsole = this.mainConsole || newLogger;

    // add a table option:
    (newLogger as KbLogger).table = () => { };
    const kbLogger: KbLogger = newLogger as KbLogger;



    return kbLogger;
  }

  private initializeFirebase(logger: winston.Logger) {
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
