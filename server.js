/**
 * server.js
 *
 * Works in the local development environment and when deployed. If successful,
 * shows a single web page with the SRTM DEM displayed in a Google Map. See
 * accompanying README file for instructions on how to set up authentication.
 */
const ee = require('@google/earthengine');
const express = require('express');
const handlebars  = require('express-handlebars');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
const routes = require('./routes');

const app = express()
  .engine('.hbs', handlebars({extname: '.hbs', cache: false}))
  .set('view engine', '.hbs')
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use('/static', express.static('static'));
    

  require('./routes')(app);

// Private key, in `.json` format, for an Earth Engine service account.
const PORT = process.env.PORT || 3000;

ee.data.authenticateViaPrivateKey(porcess.env.PRIVATE_KEY, () => {
  ee.initialize(null, null, () => {
    app.listen(PORT);
    console.log(`Listening on port ${PORT}`);
  });
});

// Expose app
exports = module.exports = app;
