import { Request } from 'express';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MultiLineString } from 'geojson';
import { User } from '../users/user.entity';
import { Trip } from './trip.entity';
import { LocationRepository } from '../locations/location.repository';
import { Location } from '../locations/relations';
import { UserRepository } from '../users/user.repository';
import { TripRepository } from './trip.repository';
import { TripHandlerFactory } from '../handlers';
import { RoutePlanProvider } from '../providers/route-plan.provider';
import { CreateTripDto, GetTripByIdDto, GetTripByPagingDto } from './dto';
import HTTPResponse from '../libs/response';
import * as ETrip from '../enums';
import * as ITrip from '../interfaces';

@Injectable()
export class TripService {
  private readonly hTTPResponse: HTTPResponse = new HTTPResponse();
  private readonly logger: Logger = new Logger('TripService');

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: TripRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    @InjectRepository(Location)
    private readonly locationRepository: LocationRepository,
    private readonly routePlanProvider: RoutePlanProvider,
  ) {}

  /**
   * @description health check use
   * @public
   * @returns {string}
   */
  public getRequest(): string {
    return 'Server is healthly';
  }

  /**
   * @description Create Trip Service layer and handling async event publish
   * @public
   * @param {Request} req
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {CreateTripDto} createTripDto
   * @returns {Promise<ITrip.IResponseBase<Trip> | HttpException>}
   */
  public async createTrip(req: Request, user: ITrip.UserInfo | ITrip.JwtPayload, createTripDto: CreateTripDto): Promise<ITrip.IResponseBase<Trip> | HttpException> {
    const { startDate, endDate, publisherId, startPointName, endPointName, publicStatus, companyName, shipNumber } = createTripDto;

    // check user information if it's pass user is valid
    if (user.id !== publisherId) {
      this.logger.error('Invalid credential', '', 'CreateTripError');
      return new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const isAdmin: boolean = user.role === ETrip.EUserRole.ADMIN;
    const publisher: User = await this.userRepository.getUserById(user.id, isAdmin);
    if (!publisher) {
      this.logger.error('User not found', '', 'CreateTripError');
      return new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // fi

    // validation relation data of Location is validate or not
    const promises = [this.locationRepository.findLocationByLocationName(startPointName), this.locationRepository.findLocationByLocationName(endPointName)];

    const locations = await Promise.all(promises);
    if (!(locations[0] instanceof Location) || !(locations[1] instanceof Location)) {
      this.logger.error('Location not found', '', 'CreateTripError');
      return new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Location not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // fi

    const routePlan: MultiLineString = await this.routePlanProvider.getRoutePlanning(
      {
        startLocationName: locations[0].locationName,
        endLocationName: locations[1].locationName,
        type: ETrip.EPlanType.TEXT,
      },
      req.headers.authorization,
    );

    const tripData: ITrip.ICreateTrip = {
      startDate,
      endDate,
      publisher,
      startPoint: locations[0],
      endPoint: locations[1],
      publicStatus,
      companyName,
      shipNumber,
      geom: routePlan || null,
    };

    try {
      // repo layer handle
      const trip = await this.tripRepository.createTrip(tripData);
      // microserivce createTrip async Event
      TripHandlerFactory.createTrip(trip);
      return this.hTTPResponse.StatusCreated(trip);
    } catch (error) {
      this.logger.error(error.message, '', 'CreateTripError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get trip by id
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {GetTripByIdDto} getTripByIdDto
   * @returns {Promise<ITrip.IResponseBase<Trip> | HttpException>}
   */
  public async getTripById(user: ITrip.UserInfo | ITrip.JwtPayload, getTripByIdDto: GetTripByIdDto): Promise<ITrip.IResponseBase<Trip> | HttpException> {
    if (user.id !== getTripByIdDto.publisherId) {
      this.logger.error('Invalid credential', '', 'GetTripByIdError');
      return new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    const isAdmin: boolean = user.role === ETrip.EUserRole.ADMIN;
    const publisher: User = await this.userRepository.getUserById(user.id, isAdmin);
    if (!publisher) {
      this.logger.error('User not found', '', 'GetTripByIdError');
      return new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const trip = await this.tripRepository.getTripById(getTripByIdDto);
      if (!trip) {
        this.logger.error(`Cannot find trip for ${getTripByIdDto.id}`, '', 'GetTripByIdError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `Cannot find trip for ${getTripByIdDto.id}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return this.hTTPResponse.StatusOK(trip);
    } catch (error) {
      this.logger.error(error.message, '', 'GetTripByIdError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get trips by paging and search optioning by selfQuerying or not
   * - Self Query means if user is doing paging-query for it's own trip or not
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {GetTripByPagingDto} getTripByPagingDto
   * @returns {Promise<ITrip.IResponseBase<ITrip.ITripPagingResponseBase<Trip[]>> | HttpException>}
   */
  public async getTripByPaging(user: ITrip.UserInfo | ITrip.JwtPayload, getTripByPagingDto: GetTripByPagingDto): Promise<ITrip.IResponseBase<ITrip.ITripPagingResponseBase<Trip[]>> | HttpException> {
    if (!getTripByPagingDto.keyword) getTripByPagingDto.keyword = '';
    if (!getTripByPagingDto.sort) getTripByPagingDto.sort = 'DESC';

    const isSelfQuery: boolean = user.id === getTripByPagingDto.publisherId;

    try {
      const { trips, count, take, skip } = await this.tripRepository.getTripByPaging(getTripByPagingDto, isSelfQuery);
      if (!trips || !count) {
        this.logger.error('Trip Not Found', '', 'GetTripByPagingError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Trip Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return this.hTTPResponse.StatusOK({
        trips,
        take,
        skip,
        count,
      });
    } catch (error) {
      this.logger.error(error.message, '', 'GetTripByPagingError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
