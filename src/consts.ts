import colors from 'colors';
import moment from 'moment';
import * as winston from 'winston';
import { isString, isObject, get, map, uniqueId } from 'lodash';
import { KbColdDeckOptions } from './interfaces';

export const firebaseAppMapper = {};

export const kbDefaultLogLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
  },
  colors: {
    verbose: colors.bgGreen,
    silly: colors.bgBlue,
    info: colors.blue,
    debug: colors.green,
    warn: colors.yellow,
    error: colors.red
  }
};

export const coldDeckDefaultOptions: KbColdDeckOptions = {
  path: 'logs',
  createDefaultConsole: true
};

const consolePrettyPrint = winston.format.printf(({ level, message, scope, timestamp, tags }) => {
  const parsedTimestamp = moment(timestamp).format('YYYY-MM-DD [||] HH:mm:ss');
  const parsedTags = map(tags, (tag) => colors[ tag.colors ](`[${ tag.msg }]`));

  let parsedLabel = parseScope(scope);
  parsedLabel = parsedLabel ? ` ${ parsedLabel }` : '';

  return `${ colors.green(parsedTimestamp) } ${ kbDefaultLogLevels.colors[ level ](level.toUpperCase()) }${ parsedLabel }${ parsedTags.length ? ' - ' + parsedTags.join('') : '' }: ${ message }`;

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
