var express = require('express');
const ee = require('@google/earthengine');

// middleware that is specific to this router

// define the home page route




module.exports = function(app) {

    // Insert routes below
    app.use('/api/calc', require('./api/calc'));
 
    // All undefined asset or api routes should return a 404
    //app.route('/:url(api|auth|components|app|bower_components|assets)/*')
     //.get(errors[404]);
  
    // All other routes should redirect to the index.html
    app.route('/*')
      .get(require('./api/main'));
  };