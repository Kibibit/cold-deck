import { ColdDeck } from './cold-deck';

it('should create an instance successfully', () => {
  const instance = new ColdDeck();

  return expect(instance).toBeTruthy();
});

it('should create a basic logger and log a message', () => {
  const instance = new ColdDeck();

  const logger = instance.createBasic();

  return expect(logger).toBeTruthy();
});

it('should successfully create child logger', () => {
  const instance = new ColdDeck();

  const logger = instance.child({});

  return expect(logger).toBeTruthy();
});

// console.log('got the host?', process.env.DB_HOST);

// const serviceAccount = require(process.env.FIREBASE_CREDENTIAL_FILE || '');

// if (!process.env.PROJECT_ID) { throw new Error('project id must be defined'); }

// const firebaseSettings = {
//   // FIREBASE
//   apiKey: process.env.API_KEY,
//   authDomain: process.env.AUTH_DOMAIN,
//   databaseURL: process.env.DATABASE_URL,
//   projectId: process.env.PROJECT_ID,
//   storageBucket: process.env.STORAGE_BUCKET,
//   messagingSenderId: process.env.MESSAGING_SENDER_ID,
//   credential: admin.credential.cert(serviceAccount)
// };

// const basicLogger = new ColdDeck({
//   path: './logs',
//   firebase: firebaseSettings
// });

// const nana = basicLogger.createBasic({ persist: true });

// nana.info('this is from the test file!');

// const childLogger = basicLogger.child({ persist: true });

// childLogger.info('this is a child!', { service: 'tits', ass: 'is nice' });


// /* jshint -W098 */
// (function () {
//   const express = require('express'),
//     app = express();

//   app.set('port', 11109);

//   app.use(basicLogger.expressLogger({ persist: true })); //Log each request

//   var port = app.get("port");

//   app.get('/', function (req, res) {
//     res.send('hello world');
//   });

//   app.listen(port, function () {
//     nana.info('Server listening at port ' + port);
//   });
// })();
