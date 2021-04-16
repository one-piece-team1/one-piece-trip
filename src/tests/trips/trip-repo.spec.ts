import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection, getManager, getRepository, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { TripRepository } from '../../trips/trip.repository';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { Location, Country } from '../../locations/relations';
import { MockCreateCountry, MockCreateLocation, MockCreateUser } from '../../libs/mock_data';
import { testOrmconfig } from '../../config/orm.config';
import * as EShare from '../../enums';

describe('# Trip Repository', () => {
  let connection: Connection;
  let tripRepository: TripRepository;
  let id: string;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(TripRepository),
          useClass: TripRepository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([User, Trip, Post, Location, Country]));
    User.useConnection(connection);
    Trip.useConnection(connection);
    Post.useConnection(connection);
    Location.useConnection(connection);
    Country.useConnection(connection);
    tripRepository = module.get(getCustomRepositoryToken(TripRepository));
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Should TripRepository be created', () => {
    expect(tripRepository).toBeDefined();
  });

  describe('# Create Trip', () => {
    it('Should be able to create trip', async (done: jest.DoneCallback) => {
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

      const trip = await tripRepository.createTrip({
        startDate: new Date().toISOString(),
        endDate: new Date('2050/01/01').toISOString(),
        publicStatus: EShare.ETripView.PUBLIC,
        geom: {
          type: 'MultiLineString',
          coordinates: [],
        },
        companyName: 'companyName',
        shipNumber: 'shipNumber',
        publisher: userResult,
        startPoint: locationResult,
        endPoint: locationResult,
      });
      expect(trip).not.toEqual(undefined);
      expect(trip.companyName).toEqual('companyName');
      expect(trip.shipNumber).toEqual('shipNumber');
      expect(trip.publisher.id).toEqual(mockCreateUser.id);
      expect(trip.startPoint.id).toEqual(mockCreateLocation.id);
      expect(trip.endPoint.id).toEqual(mockCreateLocation.id);
      expect(trip.startPoint.country.id).toEqual(mockCreateCountry.id);
      expect(trip.endPoint.country.id).toEqual(mockCreateCountry.id);
      // if all expected assign test id
      id = trip.id;
      userId = trip.publisher.id;
      done();
    });

    it('Should not be able to create trip when column is missing', async (done: jest.DoneCallback) => {
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

      const user = new User();
      const mockCreateUser = MockCreateUser();
      Object.assign(user, mockCreateUser);
      user.salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash('Aabc123', user.salt);
      try {
        await tripRepository.createTrip({
          startDate: new Date().toISOString(),
          endDate: new Date('2050/01/01').toISOString(),
          publicStatus: EShare.ETripView.PUBLIC,
          geom: {
            type: 'MultiLineString',
            coordinates: [],
          },
          companyName: 'companyName',
          shipNumber: 'shipNumber',
          publisher: user,
          startPoint: location,
          endPoint: location,
        });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(violates|foreign|key)/gi);
      }
      done();
    });
  });

  describe('# Verify By Trip Id', () => {
    it('Should be able to verify by trip id', async (done: jest.DoneCallback) => {
      const result = await tripRepository.verifyByTripById(id);
      expect(result).not.toEqual(undefined);
      expect(result.companyName).toEqual('companyName');
      expect(result.shipNumber).toEqual('shipNumber');
      done();
    });

    it('Should not be able to verify by trip id', async (done: jest.DoneCallback) => {
      const result = await tripRepository.verifyByTripById(uuidv4());
      expect(result).toEqual(undefined);
      done();
    });

    it('Should throw exception when id is not an uuid', async (done: jest.DoneCallback) => {
      try {
        await tripRepository.verifyByTripById('123');
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(invalid|syntax|uuid)/gi);
      }
      done();
    });
  });

  describe('# Get By Trip Id', () => {
    it('Should be able to get by trip id', async (done: jest.DoneCallback) => {
      const result = await tripRepository.getTripById({ id, publisherId: userId });
      expect(result).not.toEqual(undefined);
      expect(result.companyName).toEqual('companyName');
      expect(result.shipNumber).toEqual('shipNumber');
      done();
    });

    it('Should not be able to get by trip id', async (done: jest.DoneCallback) => {
      const result = await tripRepository.getTripById({ id: uuidv4(), publisherId: userId });
      expect(result).toEqual(undefined);
      done();
    });

    it('Should throw exception when id is not an uuid', async (done: jest.DoneCallback) => {
      try {
        await tripRepository.getTripById({ id: '123', publisherId: userId });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(invalid|syntax|uuid)/gi);
      }
      done();
    });
  });

  describe('# Get trip by paging', () => {
    it('Should be able to get trip by paging and get one only', async (done: jest.DoneCallback) => {
      const { trips, take, skip, count } = await tripRepository.getTripByPaging({ publisherId: userId, sort: 'DESC' }, true);
      expect(trips).not.toEqual(undefined);
      expect(trips[0].id).toEqual(id);
      expect(take).toEqual(10), expect(skip).toEqual(0);
      expect(count).toEqual(1);
      done();
    });

    it('Should be able to get trip by paging and get non', async (done: jest.DoneCallback) => {
      const { trips, take, skip, count } = await tripRepository.getTripByPaging({ publisherId: userId, sort: 'DESC' }, false);
      expect(trips).not.toEqual(undefined);
      expect(trips.length).toEqual(0);
      expect(take).toEqual(10), expect(skip).toEqual(0);
      expect(count).toEqual(0);
      done();
    });

    it('Should throw exception when publisherId is not an uuid', async (done: jest.DoneCallback) => {
      try {
        await tripRepository.getTripByPaging({ publisherId: '123' }, false);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toMatch(/(invalid|syntax|uuid)/gi);
      }
      done();
    });
  });
});
