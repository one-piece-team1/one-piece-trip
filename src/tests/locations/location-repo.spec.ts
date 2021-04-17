import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection, getManager } from 'typeorm';
import { LocationRepository } from '../../locations/location.repository';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { Location, Country } from '../../locations/relations';
import { MockCreateCountry, MockCreateLocation, MockCreateUser, MockCreateTrip } from '../../libs/mock_data';
import { testOrmconfig } from '../../config/orm.config';

describe('# Location Repository', () => {
  let connection: Connection;
  let locationRepository: LocationRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(LocationRepository),
          useClass: LocationRepository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([User, Trip, Post, Location, Country]));
    User.useConnection(connection);
    Trip.useConnection(connection);
    Post.useConnection(connection);
    Location.useConnection(connection);
    Country.useConnection(connection);
    locationRepository = module.get(getCustomRepositoryToken(LocationRepository));
  });

  afterAll(async () => {
    await connection.close();
  });

  it('Should locationRepostiroy be created', () => {
    expect(locationRepository).toBeDefined();
  });

  describe('# Find Location By LocationName', () => {
    it('Should be not able to find Location by locationName when not existed', async (done: jest.DoneCallback) => {
      try {
        await locationRepository.findLocationByLocationName('test');
      } catch (error) {
        expect(error).not.toEqual(undefined);
      }
      done();
    });

    it('Should be able to find Location by locationName', async (done: jest.DoneCallback) => {
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

      const res = await locationRepository.findLocationByLocationName(locationResult.locationName);
      expect(res.locationName).toEqual(locationResult.locationName);
      done();
    });
  });
});
