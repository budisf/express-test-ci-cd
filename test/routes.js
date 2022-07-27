process.env.NODE_ENV = 'test';

const request = require('supertest');
const should = require('chai').should();

describe('Route tests', () => {
  server = require('../src/server');
  describe('/rides route', () => {
    describe('Initial GET', () => {
      it('Should have status 200', (done) => {
        request(server)
          .get('/api/rides')
          .end((req, res) => {
            res.status.should.equal(200);
            done();
          });
      });
    });
  });

  describe('/users route', () => {
    describe('POST: Create users with varying parameters', () => {
      it('Should make a user abc1 with default values on all non-username parameters', (done) => {
        request(server)
          .post('/api/users?username=abc1')
          .end((req, res) => {
            res.status.should.equal(200);
            res.body.username.should.equal('abc1');
            res.body.first_name.should.equal('abc1');
            res.body.last_name.should.equal('');
            res.body.email.should.equal('abc1@rice.edu');
            res.body.phone.should.equal('');
            done();
          });
      });

      it('Should make a user abc2 with non-default values on all parameters', (done) => {
        request(server)
          .post('/api/users?username=abc2&first_name=foo&last_name=bar&email=foobar@foobar.cool&phone=0000000')
          .end((req, res) => {
            res.status.should.equal(200);
            res.body.username.should.equal('abc2');
            res.body.first_name.should.equal('foo');
            res.body.last_name.should.equal('bar');
            res.body.email.should.equal('foobar@foobar.cool');
            res.body.phone.should.equal('0000000');
            done();
          });
      });

      it('Should not allow another user with username abc1 to be created', (done) => {
        request(server)
          .post('/api/users?username=abc1')
          .end((req, res) => {
            res.status.should.equal(403);
            done();
          });
      });
    });

    describe('GET: Read users', () => {
      it('Should find user abc1', (done) => {
        request(server)
          .get('/api/users/abc1')
          .end((req, res) => {
            res.status.should.equal(200);
            res.body.username.should.equal('abc1');
            res.body.first_name.should.equal('abc1');
            res.body.last_name.should.equal('');
            res.body.email.should.equal('abc1@rice.edu');
            res.body.phone.should.equal('');
            done();
          });
      });

      it('Should have status 404 when GETing nonexistant user abc3', (done) => {
        request(server)
          .get('/api/users/abc3')
          .end((req, res) => {
            res.status.should.equal(404);
            done();
          });
      });
    });

    describe('DELETE: Delete users', () => {
      it('Should delete users abc1 and abc2', (done) => {
        request(server)
          .delete('/api/users/abc1')
          .end((req, res) => {
            res.status.should.equal(200);
            request(server)
              .delete('/api/users/abc2')
              .end((req, res) => {
                res.status.should.equal(200);
                done();
              });
          });
      });

      it('Should not find user abc1 on GET request', (done) => {
        request(server)
          .get('/api/users/abc1')
          .end((req, res) => {
            res.status.should.equal(404);
            res.body.should.be.empty;
            done();
          });
      });

      it('Should have status 404 when trying to delete nonexistant user abc3', () => {
        request(server)
          .delete('/api/users/abc3')
          .end((req, res) => {
            res.status.should.equal(404);
            done();
          });
      });
    });
  });
});
