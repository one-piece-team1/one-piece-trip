import { Test, TestingModule } from '@nestjs/testing';
import httpRequest from 'request-promise';
import { RoutePlanProvider } from '../../providers/route-plan.provider';
import { MockGenerateRoutesAsLine, MockGenerateRoutesAsText } from '../../libs/mock_data';
import { SearchForPlanStartandEndPointDto } from '../../providers/dtos';

jest.mock('request-promise');

describe('# Route Plan Provider', () => {
  let routePlanProvider: RoutePlanProvider;
  let mockSearchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoutePlanProvider],
    }).compile();

    routePlanProvider = module.get<RoutePlanProvider>(RoutePlanProvider);
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockSearchForPlanStartandEndPointDto = null;
  });

  describe('# Convert To INetworkGeometryResponse MultiLineString', () => {
    it('Should be able convert to MultiLineString when provider response as Text', () => {
      const mockData = MockGenerateRoutesAsText();
      const result = routePlanProvider.convertToMultiLineString(mockData);
      expect(result.type).toEqual('MultiLineString');
      expect(typeof result.coordinates).toEqual('object');
      expect(result.coordinates.length).toEqual(1);
      expect(result.coordinates[0]).toEqual(mockData[0].lineString.coordinates);
    });

    it('Should be able convert to MultiLineString when provider response as Line', () => {
      const mockData = MockGenerateRoutesAsLine();
      const result = routePlanProvider.convertToMultiLineString(mockData);
      expect(result.type).toEqual('MultiLineString');
      expect(typeof result.coordinates).toEqual('object');
      expect(result.coordinates.length).toEqual(1);
      expect(result.coordinates[0].length).toEqual(0);
    });
  });

  describe('# Get Route Planning', () => {
    it('Should receive empty coordinates when api status is not success', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
      };
      httpRequest.get = jest.fn().mockImplementation(() => Promise.resolve({ status: 'error' }));
      const result = await routePlanProvider.getRoutePlanning(mockSearchForPlanStartandEndPointDto, '');
      expect(result.type).toEqual('MultiLineString');
      expect(result.coordinates.length).toEqual(0);
      done();
    });

    it('Should caught exception when provider reject', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
      };
      httpRequest.get = jest.fn().mockImplementation(() => Promise.reject(new Error('test')));
      try {
        await routePlanProvider.getRoutePlanning(mockSearchForPlanStartandEndPointDto, '');
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(error.message).toEqual('test');
      }
      done();
    });

    it('Should be able to return route plan when provider resolve as line', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
      };
      httpRequest.get = jest.fn().mockImplementation(() => Promise.resolve({ status: 'success', message: MockGenerateRoutesAsLine() }));
      const result = await routePlanProvider.getRoutePlanning(mockSearchForPlanStartandEndPointDto, '');
      expect(result.type).toEqual('MultiLineString');
      expect(result.coordinates.length).toEqual(1);
      expect(result.coordinates[0].length).toEqual(0);
      done();
    });

    it('Should be able to return route plan when provider resolve as text', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
      };
      const mockData = MockGenerateRoutesAsText();
      httpRequest.get = jest.fn().mockImplementation(() => Promise.resolve({ status: 'success', message: mockData }));
      const result = await routePlanProvider.getRoutePlanning(mockSearchForPlanStartandEndPointDto, '');
      expect(result.type).toEqual('MultiLineString');
      expect(typeof result.coordinates).toEqual('object');
      expect(result.coordinates.length).toEqual(1);
      expect(result.coordinates[0]).toEqual(mockData[0].lineString.coordinates);
      done();
    });
  });
});
