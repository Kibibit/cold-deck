import * as winston from 'winston';
import { coldDeck } from './cold-deck';
import path from 'path';

const kbConsole = coldDeck.child({
  scope: 'Express',
  label: 'Express',
  transports: [
    new winston.transports.File({ filename: path.join(coldDeck.globalOptions.path, '/express.log') })
  ]
});

export const logger = expressLogger;

function expressLogger(validate?) {

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
      // .time()
      // .tag(
      //   { msg: 'Express', colors: 'cyan' },
      //   { msg: req.ip, colors: 'red' },
      //   { msg: req.method, colors: 'green' },
      //   {
      //     msg: (/mobile/i.test(req.headers[ 'user-agent' ]) ? 'MOBILE' : 'DESKTOP'),
      //     colors: 'grey'
      //   }
      // )
      // .info(req.url);
    }

    next();
  };

};
