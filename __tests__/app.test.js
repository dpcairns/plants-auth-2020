require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;
  
    beforeAll(async done => {
      execSync('npm run setup-db');
  
      client.connect();
  
      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });
      
      token = signInData.body.token;
  
      return done();
    });
  
    afterAll(done => {
      return client.end(done);
    });

    test('returns JUST JON\'s plants', async() => {

      const expectation = [
        {
          'id': 4,
          'name': 'bessie',
          'cool_factor': 3,
          is_watered: false,
          'owner_id': 2
        },
        {
          'id': 5,
          'name': 'jumpy',
          'cool_factor': 4,
          is_watered: false,
          'owner_id': 2
        },
        {
          'id': 6,
          'name': 'spot',
          'cool_factor': 10,
          is_watered: false,
          'owner_id': 2
        }
      ];

      await fakeRequest(app)
        .post('/api/plants')
        .send(expectation[0])
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      await fakeRequest(app)
        .post('/api/plants')
        .send(expectation[1])
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      await fakeRequest(app)
        .post('/api/plants')
        .send(expectation[2])
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);

      const data = await fakeRequest(app)
        .get('/api/plants')
        .set('Authorization', token)
        .expect('Content-Type', /json/)
        .expect(200);
        
      expect(data.body).toEqual(expectation);
    });
  });
  
});
