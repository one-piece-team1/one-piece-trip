import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TripService } from '../../trips/trip.service';
import { TripRepository } from '../../trips/trip.repository';
import { UserRepository } from '../../users/user.repository';
import { LocationRepository } from '../../locations/location.repository';
import { Trip } from '../../trips/trip.entity';
import { Location } from '../../locations/relations';
import { RoutePlanProvider } from '../../providers/route-plan.provider';
import { TripHandlerFactory } from '../../handlers';
import { MockCreateLocation, MockCreateTrip, MockCreateUser } from '../../libs/mock_data';
import { CreateTripDto, GetTripByIdDto, GetTripByPagingDto } from '../../trips/dto';
import * as EShare from '../../enums';
import * as IShare from '../../interfaces';

jest.mock('../../handlers');
describe('# Trip Service', () => {
  let tripService: TripService;
  let tripRepository: TripRepository;
  let userRepository: UserRepository;
  let locationRepository: LocationRepository;
  let routePlanProvider: RoutePlanProvider;

  // mock
  let mockCreateTripDto: CreateTripDto;
  let mockGetTripByIdDto: GetTripByIdDto;
  let mockGetTripByPagingDto: GetTripByPagingDto;
  let userMock: IShare.UserInfo | IShare.JwtPayload;
  const mockRequest = {
    headers: {
      authorization: 'mockToken',
    },
  } as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripService,
        {
          provide: TripRepository,
          useValue: {
            createTrip: jest.fn(),
            getTripById: jest.fn(),
            getTripByPaging: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            getUserById: jest.fn(),
          },
        },
        {
          provide: LocationRepository,
          useValue: {
            findLocationByLocationName: jest.fn(),
          },
        },
        {
          provide: RoutePlanProvider,
          useValue: {
            getRoutePlanning: jest.fn(),
          },
        },
      ],
    }).compile();

    tripService = module.get<TripService>(TripService);
    tripRepository = module.get<TripRepository>(TripRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    locationRepository = module.get<LocationRepository>(LocationRepository);
    routePlanProvider = module.get<RoutePlanProvider>(RoutePlanProvider);
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockCreateTripDto = null;
    mockGetTripByIdDto = null;
    mockGetTripByPagingDto = null;
  });

  it('Should all instances to be created', () => {
    expect(tripService).toBeDefined();
    expect(tripRepository).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(locationRepository).toBeDefined();
    expect(routePlanProvider).toBeDefined();
  });

  describe('# Healh Check', () => {
    it('Should return health check', () => {
      expect(tripService.getRequest()).toEqual('Server is healthly');
    });
  });

  describe('# Create Trip', () => {
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
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const result = await tripService.createTrip(mockRequest, userMock, mockCreateTripDto);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse['error']).toEqual('Invalid credential');
      done();
    });

    it('Should be able to return User not found custom error when user not existed', async (done: jest.DoneCallback) => {
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
      userMock = {
        id: mockCreateTripDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      userRepository.getUserById = jest.fn().mockReturnValueOnce(undefined);
      const result = await tripService.createTrip(mockRequest, userMock, mockCreateTripDto);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.BAD_REQUEST);
      expect(resultResponse['error']).toEqual('User not found');
      done();
    });

    it('Should be able to return Location not found custom error when Locations not existed', async (done: jest.DoneCallback) => {
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
      userMock = {
        id: mockCreateTripDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      const userResultMock = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(userResultMock);
      locationRepository.findLocationByLocationName = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);
      const result = await tripService.createTrip(mockRequest, userMock, mockCreateTripDto);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.BAD_REQUEST);
      expect(resultResponse['error']).toEqual('Location not found');
      done();
    });

    it('Should be able to return trip', async (done: jest.DoneCallback) => {
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
      userMock = {
        id: mockCreateTripDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      const userResultMock = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(userResultMock);
      const locationResultMock = new Location();
      const mockCreateLocation = MockCreateLocation();
      Object.assign(locationResultMock, mockCreateLocation);
      locationRepository.findLocationByLocationName = jest
        .fn()
        .mockReturnValueOnce(locationResultMock)
        .mockReturnValueOnce(locationResultMock);
      routePlanProvider.getRoutePlanning = jest.fn().mockReturnValueOnce({
        type: 'MultiLineString',
        coordinates: [],
      });
      const tripResultMock = MockCreateTrip();
      tripRepository.createTrip = jest.fn().mockReturnValueOnce(tripResultMock);
      TripHandlerFactory.createTrip = jest.fn().mockImplementation(() => ({}));
      const result = await tripService.createTrip(mockRequest, userMock, mockCreateTripDto);
      const resultResponse = result as IShare.IResponseBase<Trip>;
      expect(resultResponse.statusCode).toEqual(HttpStatus.CREATED);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message['id']).toEqual(tripResultMock.id);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
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
      userMock = {
        id: mockCreateTripDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      const userResultMock = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(userResultMock);
      const locationResultMock = new Location();
      const mockCreateLocation = MockCreateLocation();
      Object.assign(locationResultMock, mockCreateLocation);
      locationRepository.findLocationByLocationName = jest
        .fn()
        .mockReturnValueOnce(locationResultMock)
        .mockReturnValueOnce(locationResultMock);
      routePlanProvider.getRoutePlanning = jest.fn().mockReturnValueOnce({
        type: 'MultiLineString',
        coordinates: [],
      });
      tripRepository.createTrip = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      TripHandlerFactory.createTrip = jest.fn().mockImplementation(() => ({}));
      const result = await tripService.createTrip(mockRequest, userMock, mockCreateTripDto);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse['error']).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get Trip By Id', () => {
    it('Should be able to return custom invalida credential error when user.id not eql to publisherId', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const getTripByIdMock: GetTripByIdDto = {
        publisherId: uuidv4(),
        id: uuidv4(),
      };
      const result = await tripService.getTripById(userMock, getTripByIdMock);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse['error']).toEqual('Invalid credential');
      done();
    });

    it('Should be able to return User not found custom error when user not existed', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const getTripByIdMock: GetTripByIdDto = {
        publisherId: userMock.id,
        id: uuidv4(),
      };
      userRepository.getUserById = jest.fn().mockReturnValueOnce(undefined);
      const result = await tripService.getTripById(userMock, getTripByIdMock);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.BAD_REQUEST);
      expect(resultResponse['error']).toEqual('User not found');
      done();
    });

    it('Should be able to return Trip not found custom error when trips not existed', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const getTripByIdMock: GetTripByIdDto = {
        publisherId: userMock.id,
        id: uuidv4(),
      };
      const userResultMock = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(userResultMock);
      tripRepository.getTripById = jest.fn().mockReturnValueOnce(undefined);
      const result = await tripService.getTripById(userMock, getTripByIdMock);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse['error']).toEqual(`Cannot find trip for ${getTripByIdMock.id}`);
      done();
    });

    it('Should be able to return trip', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const getTripByIdMock: GetTripByIdDto = {
        publisherId: userMock.id,
        id: uuidv4(),
      };
      const userResultMock = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(userResultMock);
      const tripResultMock = MockCreateTrip();
      tripRepository.getTripById = jest.fn().mockReturnValueOnce(tripResultMock);
      const result = await tripService.getTripById(userMock, getTripByIdMock);
      const resultResponse = result as IShare.IResponseBase<Trip>;
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message['id']).toEqual(tripResultMock.id);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const getTripByIdMock: GetTripByIdDto = {
        publisherId: userMock.id,
        id: uuidv4(),
      };
      const userResultMock = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(userResultMock);
      const tripResultMock = MockCreateTrip();
      tripRepository.getTripById = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await tripService.getTripById(userMock, getTripByIdMock);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse['error']).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get Trip By Paging', () => {
    it('Should be able to return Trip not found custom error when trips not existed', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const GetTripByPagingDtoMock: GetTripByPagingDto = {
        publisherId: uuidv4(),
      };
      tripRepository.getTripByPaging = jest.fn().mockReturnValueOnce({ trips: undefined, count: undefined, take: 10, skip: 1 });
      const result = await tripService.getTripByPaging(userMock, GetTripByPagingDtoMock);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse['error']).toEqual('Trip Not Found');
      done();
    });

    it('Should be able to return Trip with paging query', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const GetTripByPagingDtoMock: GetTripByPagingDto = {
        publisherId: uuidv4(),
      };
      const tripResultMock = MockCreateTrip();
      tripRepository.getTripByPaging = jest.fn().mockReturnValueOnce({ trips: [tripResultMock], count: 1, take: 10, skip: 1 });
      const result = await tripService.getTripByPaging(userMock, GetTripByPagingDtoMock);
      const resultResponse = result as IShare.IResponseBase<IShare.ITripPagingResponseBase<Trip[]>>;
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.message.trips.length).toEqual(resultResponse.message.count);
      expect(resultResponse.message.take).toEqual(10);
      expect(resultResponse.message.skip).toEqual(1);
      expect(resultResponse.message.trips[0].id).toEqual(tripResultMock.id);
      expect(resultResponse.message.count).toEqual(1);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const GetTripByPagingDtoMock: GetTripByPagingDto = {
        publisherId: uuidv4(),
      };
      tripRepository.getTripByPaging = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await tripService.getTripByPaging(userMock, GetTripByPagingDtoMock);
      const resultResponse = (result as HttpException).getResponse();
      expect(resultResponse['status']).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse['error']).toEqual('Internal Server Error');
      done();
    });
  });
});
