import bodyParser from 'body-parser';
import express from 'express';
import partials from 'express-partials';
import methodOverride from 'method-override';
import { ColdDeck } from '../cold-deck';
import path from 'path';
import FileAsync from 'lowdb/adapters/FileAsync';
import moment from 'moment';
import fs from 'fs-extra';
import lowdb from 'lowdb';

export function kbUnAuthenticatedRoute(coldDeck: ColdDeck): express.Express {

  const webPanel = express();

  webPanel.set('views', __dirname + '/../../views');
  webPanel.set('view engine', 'ejs');
  webPanel.set('view engine', 'html');
  webPanel.use(partials());
  webPanel.use(bodyParser.urlencoded({ extended: true }));
  webPanel.use(bodyParser.json());
  webPanel.use(methodOverride());
  webPanel.use(express.static(__dirname + '/../../public'));
  webPanel.use(errorHandler);

  webPanel.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/../../public/kb-cd-ui/index.html'));
  });

  webPanel.get('/logs', function (req, res, next) {
    const day = moment.utc().format('YYYY-MM-DD');
    const adapter = new FileAsync(process.cwd() + `/logs/${ day }.json`);

    fs.ensureFile(process.cwd() + `/logs/${ day }.json`)
      .then(() => lowdb(adapter))
      .then((db) => {
        // send this day's database
        const todaysLogs = db.getState();

        res.json(todaysLogs);

        // we later need to also open a web-socket channel to update for changes in today's logs' wdb
      })
      .catch((err) => next(err));
  });

  webPanel.get('/log-days', function (req, res, next) {
    const directoryPath = path.join(process.cwd(), '/logs');

    fs.readdir(directoryPath)
      .then((files) => res.json(files))
      .catch((err) => next(err));
  });

  webPanel.get('*', function (req, res) {
    res.status(404);
    res.render('error.ejs', { error: `the page you are looking for can't be found`, statusCode: 404 });
  });

  return webPanel;

  function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error.ejs', { error: err });
  }

};
