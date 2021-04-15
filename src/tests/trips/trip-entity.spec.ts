import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, createConnection, getRepository, Connection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { Location, Country } from '../../locations/relations';
import { MockCreateCountry, MockCreateLocation, MockCreateUser, MockCreateTrip } from '../../libs/mock_data';
import { testOrmconfig } from '../../config/orm.config';
import * as EShare from '../../enums';

describe('# Trip Entity', () => {
  let connection: Connection;
  let userRepository: Repository<User>;
  let tripRepository: Repository<Trip>;
  let locationRepository: Repository<Location>;
  let countryRepository: Repository<Country>;
  let id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Trip),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Location),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Country),
          useClass: Repository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([User, Trip, Post, Location, Country]));
    tripRepository = getRepository(Trip, 'testConnection');
    userRepository = getRepository(User, 'testConnection');
    locationRepository = getRepository(Location, 'testConnection');
    countryRepository = getRepository(Country, 'testConnection');
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('# Create Trip', () => {
    it('Should be able to create a trip', async (done: jest.DoneCallback) => {
      const country = new Country();
      const mockCreateCountry = MockCreateCountry();
      Object.assign(country, mockCreateCountry);
      const countryResult = await countryRepository.save(country);

      const location = new Location();
      const mockCreateLocation = MockCreateLocation();
      Object.assign(location, mockCreateLocation);
      location.country = countryResult;
      const locationResult = await locationRepository.save(location);

      const user = new User();
      const mockCreateUser = MockCreateUser();
      Object.assign(user, mockCreateUser);
      user.salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash('Aabc123', user.salt);
      const userResult = await userRepository.save(user);

      const trip = new Trip();
      const mockCreateTrip = MockCreateTrip();
      Object.assign(trip, mockCreateTrip);
      trip.publisher = userResult;
      trip.startPoint = locationResult;
      trip.endPoint = locationResult;
      const tripResult = await tripRepository.save(trip);
      expect(tripResult.id).toEqual(mockCreateTrip.id);
      expect(tripResult.publisher.id).toEqual(mockCreateUser.id);
      expect(tripResult.startPoint.id).toEqual(mockCreateLocation.id);
      expect(tripResult.endPoint.id).toEqual(mockCreateLocation.id);
      expect(tripResult.startPoint.country.id).toEqual(mockCreateCountry.id);
      expect(tripResult.endPoint.country.id).toEqual(mockCreateCountry.id);
      // if all expected assign test id
      id = tripResult.id;
      done();
    });
  });

  describe('# Get Trip By Id', () => {
    it('Should be able to get trip', async (done: jest.DoneCallback) => {
      const trip = await tripRepository.findOne({ where: { id } });
      expect(trip).not.toEqual(undefined);
      done();
    });
  });

  describe('# Update Trip By Id', () => {
    it('Should be able to update trip by id', async (done: jest.DoneCallback) => {
      const trip = await tripRepository.findOne({ where: { id } });
      trip.shipNumber = 'newShipNumber';
      const result = await tripRepository.save(trip);
      expect(result.shipNumber).toEqual(trip.shipNumber);
      done();
    });
  });

  describe('# Delete Trip By Id', () => {
    it('Should be able to delete trip by id', async (done: jest.DoneCallback) => {
      await tripRepository.delete(id);
      const trip = await tripRepository.findOne({ where: { id } });
      expect(trip).toEqual(undefined);
      done();
    });
  });
});
