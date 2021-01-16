import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TripRepository } from './trip.repository';
import * as IUser from '../interfaces';
import { CreateTripDto } from './dto';
import { LocationRepository } from 'locations/location.repository';
import { Location } from '../locations/relations';
import { User } from '../users/user.entity';
import { UserRepository } from 'users/user.repository';
import { TripHandlerFactory } from '../handlers';
import * as ETrip from '../enums';
import * as ITrip from '../interfaces';

@Injectable()
export class TripService {
  private readonly logger: Logger = new Logger('');

  constructor(private readonly tripRepository: TripRepository, private readonly userRepository: UserRepository, private readonly locationRepository: LocationRepository) {}

  public async getRequest(): Promise<string> {
    return 'Hello World!';
  }

  public async createTrip(user: IUser.UserInfo | IUser.JwtPayload, createTripDto: CreateTripDto): Promise<ITrip.ResponseBase> {
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

    const tripData: ITrip.ICreateTrip = {
      startDate,
      endDate,
      publisher,
      startPoint: locations[0],
      endPoint: locations[1],
      publicStatus,
      companyName,
      shipNumber,
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
      this.logger.log(error.message, 'SignIn');
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
