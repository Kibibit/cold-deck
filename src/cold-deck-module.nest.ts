// beaver is the logger module for nest.js

import { INestApplication } from '@nestjs/common';
import { KbColdDeckOptions, ColdDeck } from '.';
import { KbLogger } from './interfaces';

export class ColdDeckModule {
  static coldDeck: ColdDeck;
  static baseLogger: KbLogger;

  public static attachLogger(
    app: INestApplication,
    options: Partial<KbColdDeckOptions> = {}
  ): { logger: KbLogger; coldDeck: ColdDeck } {
    this.coldDeck = new ColdDeck(options);
    this.baseLogger = this.coldDeck.createBasic();

    app.use('/logs', this.coldDeck.expressMiddleware({}));

    app.use(this.coldDeck.expressLogger());

    return {
      logger: this.baseLogger,
      coldDeck: this.coldDeck
    };
  }
}
