import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { config } from '../../../config';

describe('# App Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.listen(config.PORT);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('# Health Check', () => {
    it('Should be able to return with success health status', async (done: jest.DoneCallback) => {
      return request(app.getHttpServer())
        .get('/healths')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          status: 'ok',
          info: {
            'Trip-Services': {
              status: 'up',
            },
          },
          error: {},
          details: {
            'Trip-Services': {
              status: 'up',
            },
          },
        })
        .then(() => done())
        .catch((err) => done(err));
    });
  });
});
