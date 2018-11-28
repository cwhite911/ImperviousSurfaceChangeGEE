const express = require('express');
const controller = require('./main.ctrl');

const router = express.Router();
router.use(function timeLog (req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });
router.get('/', controller.main);

exports = module.exports = router;