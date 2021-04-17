import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../app.module';
import { JwtStrategy } from '../../strategy/jwt-strategy';
import { TripService } from '../../trips/trip.service';
import { PostService } from '../../posts/post.service';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { MockCreateTrip, MockCreatePost } from '../../libs/mock_data';
import { CreateTripDto, GetTripByIdDto, GetTripByPagingDto } from '../../trips/dto';
import { CreatePostDto } from '../../posts/dto';
import { config } from '../../../config';
import * as EShare from '../../enums';
import * as IShare from '../../interfaces';

interface IDtoException {
  statusCode: number;
  message: string[];
  error: string;
}

interface IServerException {
  response?: {
    status?: number;
    error?: string;
  };
  status: number;
  message?: string;
}

jest.mock('../../handlers');
describe('# App Integration', () => {
  const testToken: string = process.env.TESTTOKEN;
  let app: INestApplication;
  let jwtStrategy: JwtStrategy;
  let tripService: TripService;
  let postService: PostService;

  // mock data
  let mockValideUser: IShare.JwtPayload;
  let mockInvalidUser: IShare.JwtPayload;
  let mockCreateTripDto: CreateTripDto;
  let mockCreatePostDto: CreatePostDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: JwtStrategy,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: TripService,
          useValue: {
            createTrip: jest.fn(),
            getTripById: jest.fn(),
            getTripByPaging: jest.fn(),
          },
        },
        {
          provide: PostService,
          useValue: {
            getPosts: jest.fn(),
            getPostById: jest.fn(),
            createPost: jest.fn(),
          },
        },
      ],
    }).compile();
    jwtStrategy = moduleFixture.get<JwtStrategy>(JwtStrategy);
    tripService = moduleFixture.get<TripService>(TripService);
    postService = moduleFixture.get<PostService>(PostService);
    mockValideUser = {
      id: uuidv4(),
      username: 'test',
      licence: 'onepiece',
      email: '',
      role: 'admin',
    };
    mockInvalidUser = {
      id: uuidv4(),
      username: 'test',
      licence: 'test',
      email: '',
      role: 'admin',
    };

    app = moduleFixture.createNestApplication();
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

  describe('# Trip Controller Integration', () => {
    describe('# (POST) /trips', () => {
      afterEach(() => {
        jest.resetAllMocks();
        mockCreateTripDto = null;
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        mockCreateTripDto = {
          startDate: new Date().toISOString(),
          endDate: new Date('2050/01/01').toISOString(),
          publisherId: '123',
          startPointName: '',
          endPointName: '',
          publicStatus: EShare.ETripView.PUBLIC,
          companyName: '',
          shipNumber: '',
        };
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .post('/trips')
          .set('Accept', 'application/json')
          .send(mockCreateTripDto);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
        expect(result.message).toEqual('Unauthorized');
        done();
      });

      it('Should be able to return bad request when dto is not satisfied', async (done: jest.DoneCallback) => {
        mockCreateTripDto = {
          startDate: new Date().toISOString(),
          endDate: new Date('2050/01/01').toISOString(),
          publisherId: '123',
          startPointName: '',
          endPointName: '',
          publicStatus: EShare.ETripView.PUBLIC,
          companyName: '',
          shipNumber: '',
        };
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const res = await request(app.getHttpServer())
          .post('/trips')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send(mockCreateTripDto);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message[0]).toMatch(/(publisherId|must|UUID)/gi);
        done();
      });

      it('Should be able to return forbidden custom error when user.id not eql to publisherId', async (done: jest.DoneCallback) => {
        mockCreateTripDto = {
          startDate: new Date().toISOString(),
          endDate: new Date('2050/01/01').toISOString(),
          publisherId: uuidv4(),
          startPointName: '',
          endPointName: '',
          publicStatus: EShare.ETripView.PUBLIC,
          companyName: '',
          shipNumber: '',
        };
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const res = await request(app.getHttpServer())
          .post('/trips')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send(mockCreateTripDto);
        const response = res.body as IServerException;
        expect(response.status).toEqual(HttpStatus.FORBIDDEN);
        expect(response.status).toEqual(response.response.status);
        expect(response.message).toEqual('Http Exception');
        expect(response.response.error).toEqual('Invalid credential');
        done();
      });

      it('Should be able to return status with success', async (done: jest.DoneCallback) => {
        mockCreateTripDto = {
          startDate: new Date().toISOString(),
          endDate: new Date('2050/01/01').toISOString(),
          publisherId: uuidv4(),
          startPointName: '',
          endPointName: '',
          publicStatus: EShare.ETripView.PUBLIC,
          companyName: '',
          shipNumber: '',
        };
        mockValideUser.id = mockCreateTripDto.publisherId;
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const mockCreateTrip = MockCreateTrip();
        tripService.createTrip = jest.fn().mockReturnValueOnce({ status: 'success', statusCode: 201, message: mockCreateTrip });
        const res = await request(app.getHttpServer())
          .post('/trips')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send(mockCreateTripDto);
        const result = res.body as IShare.IResponseBase<Trip>;
        expect(result.statusCode).toEqual(HttpStatus.CREATED);
        expect(result.status).toEqual('success');
        expect(result.message.id).toEqual(mockCreateTrip.id);
        done();
      });
    });

    describe('# (GET) /trips/:id/publishers/:publisherId ', () => {
      afterEach(() => {
        jest.resetAllMocks();
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res = await request(app.getHttpServer()).get('/trips/123/publishers/123');
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
        expect(result.message).toEqual('Unauthorized');
        done();
      });

      it('Should be able to return bad request when dto is not satisfied', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const res = await request(app.getHttpServer())
          .get('/trips/123/publishers/123')
          .set('Authorization', `Bearer ${testToken}`);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message[0] as string).toMatch(/(publisherId|must|UUID)/gi);
        expect(result.message[1] as string).toMatch(/(id|must|UUID)/gi);
        done();
      });

      it('Should be able to return status with success', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const mockTrip = MockCreateTrip() as Trip;
        tripService.getTripById = jest.fn().mockReturnValueOnce({ statusCode: 200, status: 'success', message: mockTrip } as IShare.IResponseBase<Trip>);
        const res = await request(app.getHttpServer())
          .get(`/trips/${mockTrip.id}/publishers/${mockValideUser.id}`)
          .set('Authorization', `Bearer ${testToken}`);
        const result = res.body as IShare.IResponseBase<Trip>;
        expect(result.statusCode).toEqual(HttpStatus.OK);
        expect(result.status).toEqual('success');
        expect(result.message.id).toEqual(mockTrip.id);
        done();
      });
    });

    describe('# (GET) /trips/paging', () => {
      afterEach(() => {
        jest.resetAllMocks();
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .get('/trips/paging')
          .query({});
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
        expect(result.message).toEqual('Unauthorized');
        done();
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const res = await request(app.getHttpServer())
          .get('/trips/paging')
          .set('Authorization', `Bearer ${testToken}`)
          .query({
            publisherId: '123',
          });
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message[0] as string).toMatch(/(publisherId|must|UUID)/gi);
        done();
      });

      it('Should be able to return status with success', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const mockTrip = MockCreateTrip() as Trip;
        tripService.getTripByPaging = jest.fn().mockReturnValueOnce({ statusCode: 200, status: 'success', message: { trips: [mockTrip], count: 1, take: 10, skip: 0 } } as IShare.IResponseBase<IShare.ITripPagingResponseBase<Trip[]>>);
        const res = await request(app.getHttpServer())
          .get('/trips/paging')
          .set('Authorization', `Bearer ${testToken}`)
          .query({
            publisherId: mockInvalidUser.id,
          });
        const result = res.body as IShare.IResponseBase<IShare.ITripPagingResponseBase<Trip[]>>;
        expect(result.statusCode).toEqual(HttpStatus.OK);
        expect(result.status).toEqual('success');
        expect(result.message.count).toEqual(1);
        expect(result.message.take).toEqual(10);
        expect(result.message.skip).toEqual(0);
        expect(result.message.trips[0].id).toEqual(mockTrip.id);
        done();
      });
    });
  });

  describe('# Post Controller Integration', () => {
    describe('# (POST) /posts', () => {
      afterEach(() => {
        jest.resetAllMocks();
        mockCreatePostDto = null;
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        mockCreatePostDto = {
          content: 'test',
          publicStatus: EShare.ETripView.PUBLIC,
          tripId: uuidv4(),
          publisherId: mockInvalidUser.id,
        };
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .post('/posts')
          .set('Accept', 'application/json')
          .send(mockCreatePostDto);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
        expect(result.message).toEqual('Unauthorized');
        done();
      });

      it('Should be able to return bad request when dto is not satisfied', async (done: jest.DoneCallback) => {
        mockCreatePostDto = {
          content: 'test',
          publicStatus: EShare.ETripView.PUBLIC,
          tripId: '123',
          publisherId: mockValideUser.id,
        };
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const res = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send(mockCreatePostDto);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message[0]).toMatch(/(publisherId|must|UUID)/gi);
        done();
      });

      it('Should be able to return status with success', async (done: jest.DoneCallback) => {
        mockCreatePostDto = {
          content: 'test',
          publicStatus: EShare.ETripView.PUBLIC,
          tripId: uuidv4(),
          publisherId: mockValideUser.id,
        };
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const mockCreatePost = MockCreatePost();
        postService.createPost = jest.fn().mockReturnValueOnce({ status: 'success', statusCode: 201, message: mockCreatePost });
        const res = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${testToken}`)
          .set('Accept', 'application/json')
          .send(mockCreatePostDto);
        const result = res.body as IShare.IResponseBase<Post>;
        expect(result.statusCode).toEqual(HttpStatus.CREATED);
        expect(result.status).toEqual('success');
        expect(result.message.id).toEqual(mockCreatePost.id);
        done();
      });
    });

    describe('# (GET) /posts/:id', () => {
      afterEach(() => {
        jest.resetAllMocks();
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res = await request(app.getHttpServer()).get(`/posts/${mockInvalidUser.id}`);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
        expect(result.message).toEqual('Unauthorized');
        done();
      });

      it('Should be able to return bad request when dto is not satisfied', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const res = await request(app.getHttpServer())
          .get(`/posts/123`)
          .set('Authorization', `Bearer ${testToken}`);
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(result.error).toEqual('Bad Request');
        expect(result.message[0] as string).toMatch(/(postId|must|UUID)/gi);
        done();
      });

      it('Should be able to return status with success', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const mockPost = MockCreatePost() as unknown;
        postService.getPostById = jest.fn().mockReturnValueOnce({ statusCode: 200, status: 'success', message: mockPost } as IShare.IResponseBase<Post>);
        const res = await request(app.getHttpServer())
          .get(`/posts/${mockValideUser.id}`)
          .set('Authorization', `Bearer ${testToken}`);
        const result = res.body as IShare.IResponseBase<Post>;
        expect(result.statusCode).toEqual(HttpStatus.OK);
        expect(result.status).toEqual('success');
        expect(result.message.id).toEqual(mockPost['id']);
        done();
      });
    });

    describe('# (GET) /posts', () => {
      afterEach(() => {
        jest.resetAllMocks();
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res = await request(app.getHttpServer())
          .get('/posts')
          .query({});
        const result = res.body as IDtoException;
        expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
        expect(result.message).toEqual('Unauthorized');
        done();
      });

      it('Should be able to return Unauthorized when guard not passed', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const mockPost = MockCreatePost() as unknown;
        postService.getPosts = jest.fn().mockReturnValueOnce({ statusCode: 200, status: 'success', message: { posts: [mockPost], count: 1, skip: 0, take: 10 } } as IShare.IResponseBase<IShare.IPostPagingResponseBase<Post[]>>);
        const res = await request(app.getHttpServer())
          .get('/posts')
          .set('Authorization', `Bearer ${testToken}`)
          .query({
            take: 10,
            skip: 0,
            sort: 'ASC',
            keyword: 0,
          });
        const result = res.body as IShare.IResponseBase<IShare.IPostPagingResponseBase<Post[]>>;
        expect(result.statusCode).toEqual(HttpStatus.OK);
        expect(result.status).toEqual('success');
        expect(result.message.count).toEqual(1);
        expect(result.message.take).toEqual(10);
        expect(result.message.skip).toEqual(0);
        expect(result.message.posts[0].id).toEqual(mockPost['id']);
        done();
      });
    });
  });
});
