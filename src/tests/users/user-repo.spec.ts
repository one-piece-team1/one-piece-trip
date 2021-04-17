import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/trip.entity';
import { Post } from '../../posts/post.entity';
import { Location, Country } from '../../locations/relations';
import { UserRepository } from '../../users/user.repository';
import { UpdateUserAdditionalInfoPublishDto } from '../../users/dto';
import { testOrmconfig } from '../../config/orm.config';

describe('# User Repository', () => {
  let connection: Connection;
  let userRepository: UserRepository;
  let id: string = '';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(UserRepository),
          useClass: UserRepository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([User, Trip, Post, Location, Country]));
    User.useConnection(connection);
    Trip.useConnection(connection);
    Post.useConnection(connection);
    Location.useConnection(connection);
    Country.useConnection(connection);
    userRepository = module.get(getCustomRepositoryToken(UserRepository));
  });

  afterAll(async () => {
    await connection.close();
  });

  it('User Repository should be created', () => {
    expect(userRepository).toBeDefined();
  });

  describe('# Create User', () => {
    it('Should not be able to create user and throw Error', async (done: jest.DoneCallback) => {
      const user = new User();
      user.username = 'test1';
      try {
        await userRepository.createUser(user);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(id|not-null)/gi);
      }
      done();
    });

    it('Should be able to create user and not throw Error', async (done: jest.DoneCallback) => {
      const user = new User();
      id = uuidv4();
      user.id = id;
      user.username = 'unit-test1';
      user.email = 'unit-test1@gmail.com';
      user.password = 'Aabc123';
      user.salt = '123';
      user.expiredDate = new Date();
      const result = await userRepository.createUser(user);
      expect(result.id).toEqual(user.id);
      expect(result.role).toEqual('user');
      expect(result.expiredDate).toEqual(user.expiredDate);
      expect(result.diamondCoin).toEqual(0);
      expect(result.goldCoin).toEqual(10);
      expect(result.username).toEqual(user.username);
      expect(result.email).toEqual(user.email);
      expect(result.password).toEqual(user.password);
      expect(result.salt).toEqual(user.salt);
      expect(user.expiredDate).toEqual(user.expiredDate);
      expect(typeof result.createdAt).not.toEqual(undefined);
      expect(typeof result.updatedAt).not.toEqual(undefined);
      done();
    });
  });

  describe('# Get User By Id', () => {
    it('Should not be able to get User when id is not existed in db', async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await userRepository.getUserById(id, false);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/Not Found/gi);
      }
      done();
    });

    it('Should be able to find User when id is valid', async (done: jest.DoneCallback) => {
      const user = await userRepository.getUserById(id, false);
      expect(user.username).toEqual('unit-test1');
      expect(user.email).toEqual('unit-test1@gmail.com');
      done();
    });
  });

  describe('# Update User Password By', () => {
    it('Should not be able to update User when id is not existed in db', async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await userRepository.updateUserPassword({ id, salt: '123', password: 'Babc123' });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(Cannot set property|of undefined)/gi);
      }
      done();
    });

    it('Should be able to Update User when id is valid', async (done: jest.DoneCallback) => {
      const user = await userRepository.updateUserPassword({ id, salt: '123', password: 'Babc123' });
      expect(user.salt).toEqual('123');
      expect(user.password).toEqual('Babc123');
      expect(user.version).toEqual(2);
      done();
    });
  });

  describe('# Update User Additional Info', () => {
    it('Should not be able to update User when id is not existed in db', async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await userRepository.updateUserAdditionalInfo({ id });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(Cannot set property|of undefined)/gi);
      }
      done();
    });

    it('Should be able to update User when id is existed in db', async (done: jest.DoneCallback) => {
      const mockAddtionDto: UpdateUserAdditionalInfoPublishDto = {
        id,
        age: 18,
        desc: 'test',
      };
      const user = await userRepository.updateUserAdditionalInfo(mockAddtionDto);
      expect(user.age).toEqual(mockAddtionDto.age);
      expect(user.desc).toEqual(mockAddtionDto.desc);
      expect(user.version).toEqual(3);
      done();
    });
  });

  describe('# Soft Delete User By Id', () => {
    it('Should not be able to soft delete User when id is not existed in db', async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await userRepository.softDeleteUser({ id });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(Cannot set property|of undefined)/gi);
      }
      done();
    });

    it('Should be able to soft delete User when id is valid', async (done: jest.DoneCallback) => {
      const user = await userRepository.softDeleteUser({ id });
      expect(user.status).toEqual(false);
      done();
    });
  });
});
