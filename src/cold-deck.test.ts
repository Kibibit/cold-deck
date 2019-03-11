import { coldDeck } from "./cold-deck";
import { logger } from './expressLogger';

const nice = coldDeck;

const console = nice.createBasic();

console.info('this is from the test file!');

const c = nice.child({ label: 'pizza' });

c.info('this is a child!', { service: 'tits', ass: 'is nice' });


/* jshint -W098 */
(function () {
  const express = require('express'),
    app = express();

  app.set('port', (process.env.PORT || 5000));

  app.use(logger()); //Log each request

  var port = app.get("port");

  app.listen(port, function () {
    console.info('Server listening at port ' + port);
  });
})();
