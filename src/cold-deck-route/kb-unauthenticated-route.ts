import bodyParser from 'body-parser';
import express, { Router } from 'express';
import partials from 'express-partials';
import methodOverride from 'method-override';

export function kbUnAuthenticatedRoute() {

  const webPanel: Router = express.Router();

  webPanel.use(partials());
  webPanel.use(bodyParser.urlencoded({ extended: true }));
  webPanel.use(bodyParser.json());
  webPanel.use(methodOverride());
  webPanel.use(express.static(__dirname + '/public'));
  webPanel.use(errorHandler);

  webPanel.get('/', function (req, res) {
    res.render('index', { user: req.user });
  });

  return webPanel;

  function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
  }

};
