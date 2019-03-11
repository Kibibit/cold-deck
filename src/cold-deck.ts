import * as winston from 'winston';
import { isNil, map, isString, get } from 'lodash';
import colors from 'colors';
import { blue, bgBlue, bgGreen, green, yellow, red } from 'colors';
import moment from 'moment';
import path from 'path';
import { isObject } from 'util';

interface KbLogger extends winston.Logger {
  table?: () => any;
}

interface ColdDeckOptions {
  path: string;
  createDefaultConsole: boolean;
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

const myFormat = winston.format.printf(({ level, message, scope, timestamp, tags }) => {
  // console.log('the level is ', myCustomLevels.levels[ level ]);
  const parsedTimestamp = moment(timestamp).format('YYYY-MM-DD [||] HH:mm:ss');
  let parsedLabel = parseScope(scope);
  parsedLabel = parsedLabel ? ` ${ parsedLabel }` : '';

  // console.log('TAGS!', tags);

  const parsedTags = map(tags, (tag) => colors[ tag.colors ](`[${ tag.msg }]`));

  // console.log('parsed tags:');
  // console.log(parsedTags);

  return `${ green(parsedTimestamp) } ${ myCustomLevels.colors[ level ](level.toUpperCase()) }${ parsedLabel }${ parsedTags.length ? ' - ' + parsedTags.join('') : '' }: ${ message }`;
});

const defaultOptions: ColdDeckOptions = {
  path: 'logs',
  createDefaultConsole: true
};

export class ColdDeck {
  // a user can create multiple consoles.
  consoles = [];
  mainConsole;
  globalOptions: ColdDeckOptions;

  constructor(options?: Partial<ColdDeckOptions>) {
    options = isNil(options) ? {} : options;

    options = Object.assign({}, defaultOptions, options);

    this.globalOptions = options as ColdDeckOptions;
  }

  child(options: { [ key: string ]: any }) {
    return this.createBasic(options);
  }

  createBasic(options?: { [ key: string ]: any }): KbLogger {
    options = options || {};

    const format = winston.format.combine(
      // winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.json()
    );

    const newLogger: winston.Logger = winston.createLogger({
      level: 'info',
      levels: myCustomLevels.levels,
      format,
      defaultMeta: { scope: 'global' },
      transports: options.transports || [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({ filename: path.join(this.globalOptions.path, '/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(this.globalOptions.path, '/combined.log') })
      ]
    });

    // winston.addColors(myCustomLevels.colors);

    if (process.env.NODE_ENV !== 'production') {
      const consoleTransport = new winston.transports.Console({
        format: myFormat
      });

      newLogger.add(consoleTransport);
    }

    this.mainConsole = this.mainConsole || newLogger;

    // add a table option:
    (newLogger as KbLogger).table = () => { };
    const kbLogger: KbLogger = newLogger as KbLogger;



    return kbLogger;
  };
}

export const coldDeck = new ColdDeck();

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
