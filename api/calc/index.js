const express = require('express');
const controller = require('./calc.ctrl');

const router = express.Router();
router.use(function timeLog (req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });
router.post('/impervious', controller.imperiousSurface);

exports = module.exports = router;