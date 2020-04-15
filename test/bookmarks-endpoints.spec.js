/*global supertest, expect*/
require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', () => {
  let db;
  
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /api/bookmarks', () => {
    context('Given no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, []);
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, testBookmarks);
      });
    });
    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
    
      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ]);
      });
    
      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].content).to.eql(expectedBookmark.content);
          });
      });
    });
  });

  describe('POST /api/bookmarks', () => {
    it('creates a bookmark, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'SQL Tutorial - W3Schools',
        url: 'https://www.w3schools.com/sql/',
        description: 'Our SQL tutorial will teach you how to use SQL in: MySQL, SQL Server, MS Access, Oracle, Sybase, Informix, ... Start learning SQL now! ... Learn by examples!',
        rating: 3
      };
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(postRes => 
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    const requiredFields = ['title', 'url', 'rating'];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'SQL Tutorial - W3Schools',
        url: 'https://www.w3schools.com/sql/',
        description: 'Our SQL tutorial will teach you how to use SQL in: MySQL, SQL Server, MS Access, Oracle, Sybase, Informix, ... Start learning SQL now! ... Learn by examples!',
        rating: 3
      };

      it(`responds with 400 and an error message when the "${field}" is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing "${field}" in request body` }
          });
      });
      
    });

    it('responds with 400 and an error message when the "ratings" field is not a number between 1 and 5', () => {
      const newBookmarkInvalidRating = {
        title: 'test-title',
        url: 'https://test.com',
        rating: 'invalid',
      };
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmarkInvalidRating)
        .expect(400, {
          error: { message: '\'rating\' must be a number between 0 and 5' }
        });
    });

    it('responds with 400 and an error message when the "url" field is not a valid url', () => {
      const newBookmarkInvalidUrl = {
        title: 'test-title',
        url: 'invalid',
        rating: 3,
      };
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmarkInvalidUrl)
        .expect(400, {
          error: { message: `'url' must be a valid URL` }
        });
    });

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      return supertest(app)
        .post('/api/bookmarks')
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title);
          expect(res.body.description).to.eql(expectedBookmark.description);
        });
    });
  });

  describe('GET /api/bookmarks/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 5;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: 'Bookmark doesn\'t exist' } });
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(expectedBookmark);
      });
    });
    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
    
      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ]);
      });
    
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.content).to.eql(expectedBookmark.content);
          });
      });
    });
  });

  describe('DELETE /api/bookmarks/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: 'Bookmark doesn\'t exist' } });
      });
    });
    
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
  
      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/bookmarks')
              .expect(expectedBookmarks)
          );
      });
    });
  });

  describe('PATCH /api/bookmarks/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: 'Bookmark doesn\'t exist' } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with a 204 and updates the bookmark', () => {
        const idToUpdate = 1;
        const updatedBookmark = {
          title: 'SQL Tutorial for Beginners: Learn SQL in 7 Days - Guru99',
          url: 'https://www.guru99.com/sql.html',
          description: 'Learn SQL for beginners in just 5 days! Click here to take our free and easy SQL tutorials, right now. No experience required.',
          rating: 2
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updatedBookmark
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updatedBookmark)
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark);
          });
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'style' or 'content'`
            }
          });
      });
      
      it('responds with 204 when updating only a subset of fields', () => {
        const idToUpdate = 1;
        const updatedBookmark = {
          url: 'https://www.guru99.com/sql.html',
          description: 'Learn SQL for beginners in just 5 days! Click here to take our free and easy SQL tutorials, right now. No experience required.',
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updatedBookmark
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updatedBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark);
          });
      });
    });
  });
});