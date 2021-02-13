import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { MultiLineString } from 'geojson';
import { TripRepository } from './trip.repository';
import * as IUser from '../interfaces';
import { CreateTripDto, GetTripByIdDto, GetTripByPagingDto } from './dto';
import { LocationRepository } from 'locations/location.repository';
import { Location } from '../locations/relations';
import { User } from '../users/user.entity';
import { UserRepository } from '../users/user.repository';
import { TripHandlerFactory } from '../handlers';
import { RoutePlanProvider } from '../providers/route-plan.provider';
import * as ETrip from '../enums';
import * as ITrip from '../interfaces';

@Injectable()
export class TripService {
  private readonly logger: Logger = new Logger('');

  constructor(private readonly tripRepository: TripRepository, private readonly userRepository: UserRepository, private readonly locationRepository: LocationRepository, private readonly routePlanProvider: RoutePlanProvider) {}

  public async getRequest(): Promise<string> {
    return 'Hello World!';
  }

  /**
   * @description Create Trip Service layer and handling async event publish
   * @public
   * @param {Request} req
   * @param {IUser.UserInfo | IUser.JwtPayload} user
   * @param {CreateTripDto} createTripDto
   * @returns {Promise<ITrip.ResponseBase>}
   */
  public async createTrip(req: Request, user: IUser.UserInfo | IUser.JwtPayload, createTripDto: CreateTripDto): Promise<ITrip.ResponseBase> {
    const { startDate, endDate, publisherId, startPointName, endPointName, publicStatus, companyName, shipNumber } = createTripDto;

    // check user information if it's pass user is valid
    if (user.id !== publisherId)
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    const isAdmin: boolean = user.role === ETrip.EUserRole.ADMIN;
    const publisher: User = await this.userRepository.getUserById(user.id, isAdmin);
    if (!publisher)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    // fi

    // validation relation data of Location is validate or not
    const promises = [this.locationRepository.findLocationByLocationName(startPointName), this.locationRepository.findLocationByLocationName(endPointName)];

    const locations = await Promise.all(promises);
    if (!(locations instanceof Array))
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Location not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    if (!(locations[0] instanceof Location) || !(locations[1] instanceof Location))
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Location not found',
        },
        HttpStatus.BAD_REQUEST,
      );
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
      return {
        statusCode: HttpStatus.CREATED,
        status: 'success',
        message: trip,
      };
    } catch (error) {
      this.logger.log(error.message, 'CreateTripError');
      throw new HttpException(
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
   * @param {IUser.UserInfo | IUser.JwtPayload} user
   * @param {GetTripByIdDto} getTripByIdDto
   * @returns {Promise<ITrip.ResponseBase>}
   */
  public async getTripById(user: IUser.UserInfo | IUser.JwtPayload, getTripByIdDto: GetTripByIdDto): Promise<ITrip.ResponseBase> {
    if (user.id !== getTripByIdDto.publisherId)
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    const isAdmin: boolean = user.role === ETrip.EUserRole.ADMIN;
    const publisher: User = await this.userRepository.getUserById(user.id, isAdmin);
    if (!publisher)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User not found',
        },
        HttpStatus.BAD_REQUEST,
      );

    try {
      const trip = await this.tripRepository.getTripById(getTripByIdDto);
      return {
        statusCode: HttpStatus.OK,
        status: 'success',
        message: trip,
      };
    } catch (error) {
      this.logger.log(error.message, 'GetTripById');
      throw new HttpException(
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
   * @param {IUser.UserInfo | IUser.JwtPayload} user
   * @param {GetTripByPagingDto} getTripByPagingDto
   * @returns {Promise<{ trips: Trip[]; count: number }>}
   */
  public async getTripByPaging(user: IUser.UserInfo | IUser.JwtPayload, getTripByPagingDto: GetTripByPagingDto): Promise<ITrip.ResponseBase> {
    if (!getTripByPagingDto.keyword) getTripByPagingDto.keyword = '';
    if (!getTripByPagingDto.sort) getTripByPagingDto.sort = 'DESC';

    const isSelfQuery: boolean = user.id === getTripByPagingDto.publisherId;

    try {
      const { trips, count } = await this.tripRepository.getTripByPaging(getTripByPagingDto, isSelfQuery);
      if (!trips || !count)
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Trips Not Found',
          },
          HttpStatus.NOT_FOUND,
        );

      return {
        statusCode: HttpStatus.OK,
        status: 'success',
        message: {
          trips,
          count,
        },
      };
    } catch (error) {
      this.logger.log(error.message, 'GetTripByPaging');
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
