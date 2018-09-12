const express = require('express');
const router = express.Router();
const Mongo = require('./Mongo');
const CONSTANTS = require('../constants');
const Symbols = require('../modules/Symbols');

router.get('/api/symbol/list', (req,res,next) => {
  let date = new Date().getDate();
  if( date === 12 || date === 28) {
    Symbols.updateSymbolsList()
    .then(() => {
      Mongo.select({}, CONSTANTS.SYMBOLS_LIST_COLLECTION, (data) => {
        res.send(JSON.stringify({status: 'ok', data: data}))
      })
    })
  } else {
    Mongo.select({}, CONSTANTS.SYMBOLS_LIST_COLLECTION, (data) => {
      res.send({status: 'ok', data: data})
    })
  }
})
