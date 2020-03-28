const express = require('express');
const logger = require('../logger');
const bookmarks = require('../store');
const bodyParser = express.json();
const uuid = require('uuid/v4');

const bookmarksRouter = express.Router();

bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    res
      .json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, desc, rating } = req.body;
    
    //basic input validation
    if(!title) {
      logger.error('no title');
      return res
        .status(400)
        .send('title required');
    }
    if(!url) {
      logger.error('no url');
      return res
        .status(400)
        .send('url required');
    }
    if(!desc) {
      logger.error('no desc');
      return res
        .status(400)
        .send('desc required');
    }
    if(!rating) {
      logger.error('no rating');
      return res
        .status(400)
        .send('rating required');
    }

    //add bookmark to store
    const id = uuid(); 
    const newBookmark = {
      id,
      title,
      url,
      desc,
      rating
    };
    bookmarks.push(newBookmark);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json({ id });
  });


module.exports = bookmarksRouter;