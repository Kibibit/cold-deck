import bodyParser from 'body-parser';
import express from 'express';
import partials from 'express-partials';
import methodOverride from 'method-override';

export function kbUnAuthenticatedRoute(): express.Express {

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
    res.render('index.ejs', { user: null });
  });

  return webPanel;

  function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error.ejs', { error: err });
  }

};
