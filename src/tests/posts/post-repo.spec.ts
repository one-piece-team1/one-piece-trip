import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection, getManager, getRepository, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PostRepository } from '../../posts/post.repository';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { Location, Country } from '../../locations/relations';
import { MockCreateCountry, MockCreateLocation, MockCreateTrip, MockCreateUser } from '../../libs/mock_data';
import { testOrmconfig } from '../../config/orm.config';
import { CreatePostDto } from '../../posts/dto';
import * as EShare from '../../enums';

describe('# Post Repository', () => {
  let connection: Connection;
  let postRepository: PostRepository;
  let id: string;
  let userId: string;

  // mock
  let mockCreatePostDto: CreatePostDto;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(PostRepository),
          useClass: PostRepository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([User, Trip, Post, Location, Country]));
    User.useConnection(connection);
    Trip.useConnection(connection);
    Post.useConnection(connection);
    Location.useConnection(connection);
    Country.useConnection(connection);
    postRepository = module.get(getCustomRepositoryToken(PostRepository));
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Should PostRepository be created', () => {
    expect(postRepository).toBeDefined();
  });

  describe('# Create Post', () => {
    afterEach(() => {
      mockCreatePostDto = null;
    });

    it('Should be able to create post', async (done: jest.DoneCallback) => {
      const country = new Country();
      const mockCreateCountry = MockCreateCountry();
      Object.assign(country, mockCreateCountry);
      const countryResult = await getManager('testConnection')
        .getRepository(Country)
        .save(country);

      const location = new Location();
      const mockCreateLocation = MockCreateLocation();
      Object.assign(location, mockCreateLocation);
      location.country = countryResult;
      const locationResult = await getManager('testConnection')
        .getRepository(Location)
        .save(location);

      const user = new User();
      const mockCreateUser = MockCreateUser();
      Object.assign(user, mockCreateUser);
      user.salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash('Aabc123', user.salt);
      const userResult = await getManager('testConnection')
        .getRepository(User)
        .save(user);

      const trip = new Trip();
      const mockCreateTrip = MockCreateTrip();
      Object.assign(trip, mockCreateTrip);
      trip.publisher = userResult;
      trip.startPoint = locationResult;
      trip.endPoint = locationResult;
      const tripResult = await getManager('testConnection')
        .getRepository(Trip)
        .save(trip);

      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: tripResult.id,
        publisherId: userResult.id,
      };

      const postResult = await postRepository.createPost(mockCreatePostDto, tripResult, userResult);
      expect(postResult.content).toEqual('test');
      expect(postResult.trip.id).toEqual(tripResult.id);
      expect(postResult.publisher.id).toEqual(userResult.id);
      id = postResult.id;
      userId = postResult.publisher.id;
      done();
    });

    it('Should not be able to create post when column is missing', async (done: jest.DoneCallback) => {
      const country = new Country();
      const mockCreateCountry = MockCreateCountry();
      Object.assign(country, mockCreateCountry);
      country.name = 'name2';
      country.code = 'ct3';
      const countryResult = await getManager('testConnection')
        .getRepository(Country)
        .save(country);

      const location = new Location();
      const mockCreateLocation = MockCreateLocation();
      Object.assign(location, mockCreateLocation);
      location.locationName = 'locationName2';
      location.country = countryResult;
      const locationResult = await getManager('testConnection')
        .getRepository(Location)
        .save(location);

      const user = new User();
      const mockCreateUser = MockCreateUser();
      Object.assign(user, mockCreateUser);
      user.username = 'unit-test2';
      user.email = 'unit-test2@gmail.com';
      user.salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash('Aabc123', user.salt);
      const userResult = await getManager('testConnection')
        .getRepository(User)
        .save(user);

      const trip = new Trip();
      const mockCreateTrip = MockCreateTrip();
      Object.assign(trip, mockCreateTrip);
      trip.publisher = userResult;
      trip.startPoint = locationResult;
      trip.endPoint = locationResult;

      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: trip.id,
        publisherId: userResult.id,
      };

      try {
        await postRepository.createPost(mockCreatePostDto, trip, userResult);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(violates|foreign|key)/gi);
      }
      done();
    });
  });

  describe('# Get Post By Id', () => {
    it('Should be able to get by post id', async (done: jest.DoneCallback) => {
      const result = await postRepository.getPostById(id, userId);
      expect(result).not.toEqual(undefined);
      expect(result.content).toEqual('test');
      done();
    });

    it('Should not be able to get by post id', async (done: jest.DoneCallback) => {
      const result = await postRepository.getPostById(uuidv4(), userId);
      expect(result).toEqual(undefined);
      done();
    });

    it('Should throw exception when id is not an uuid', async (done: jest.DoneCallback) => {
      try {
        await postRepository.getPostById('123', userId);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(invalid|syntax|uuid)/gi);
      }
      done();
    });
  });

  describe('# Get Post with Paging', () => {
    it('Should be able to get post by paging and get one only', async (done: jest.DoneCallback) => {
      const { posts, take, skip, count } = await postRepository.getPosts({ sort: 'DESC' }, true);
      expect(posts).not.toEqual(undefined);
      expect(posts[0].id).toEqual(id);
      expect(take).toEqual(10);
      expect(skip).toEqual(0);
      expect(count).toEqual(1);
      done();
    });

    it('Should be able to get post by paging and get non', async (done: jest.DoneCallback) => {
      await getRepository(Post, 'testConnection').delete(id);
      const { posts, take, skip, count } = await postRepository.getPosts({ sort: 'DESC' }, true);
      expect(posts.length).toEqual(0);
      expect(take).toEqual(10);
      expect(skip).toEqual(0);
      expect(count).toEqual(0);
      done();
    });

    it('Should throw exception when exception is caught', async (done: jest.DoneCallback) => {
      try {
        await postRepository.getPosts({ take: -10 }, true);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(LIMIT|not|negative)/gi);
      }
      done();
    });
  });
});
