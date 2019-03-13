import * as winston from 'winston';
import { ColdDeck, KbLoggerOptions } from './cold-deck';
import path from 'path';

export function createExpressLogger(coldDeck: ColdDeck, options: KbLoggerOptions = {}) {
  const kbConsole = coldDeck.child({
    persist: options.persist,
    scope: options.scope || 'Express',
    transports: [
      new winston.transports.File({ filename: path.join(coldDeck.globalOptions.path, '/express.log') })
    ]
  });

  return function expressLogger(validate?) {

    return function (req, res, next) {

      if (!validate || validate(req, res)) {

        kbConsole.info(req.url, {
          scope: { msg: 'express', colors: 'bgYellow.magenta' },
          tags: [
            { msg: req.ip === '::1' ? 'localhost' : req.ip, colors: 'red' },
            { msg: req.method, colors: 'green' },
            {
              msg: (/mobile/i.test(req.headers[ 'user-agent' ]) ? 'MOBILE' : 'DESKTOP'),
              colors: 'grey'
            }
          ]
        });
      }

      next();
    };

  }
}
