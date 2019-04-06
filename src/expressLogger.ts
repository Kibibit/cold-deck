import path from 'path';
import * as winston from 'winston';
import { get } from 'lodash';

import { ColdDeck } from './cold-deck';
import { KbLoggerOptions } from './interfaces';
import { KbLowDbTransport } from './lowdb.transport';

export function createExpressLogger(coldDeck: ColdDeck, options: KbLoggerOptions = {}) {
  const kbConsole = coldDeck.child({
    persist: options.persist,
    scope: options.scope || 'Express',
    transports: [
      new KbLowDbTransport({ folder: path.join(coldDeck.globalOptions.path) })
    ]
  });

  return function (req, res, next) {
    const logParams = {
      scope: { msg: 'express', colors: 'bgYellow.magenta' },
      tags: [
        { msg: req.ip.includes('127.0.0.1') || req.ip.startsWith('::1') ? 'localhost' : req.ip, colors: 'red' },
        { msg: req.method, colors: 'green' },
        {
          msg: (/mobile/i.test(req.headers[ 'user-agent' ]) ? 'MOBILE' : 'DESKTOP'),
          colors: 'grey'
        }
      ]
    };

    if (get(req, 'user.username')) {
      logParams.tags.push({ msg: get(req, 'user.username'), colors: 'bgBlue.yellow' });
    }

    kbConsole.info(req.url, logParams);

    next();
  };

}
