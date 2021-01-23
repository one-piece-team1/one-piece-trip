import { Body, Controller, Get, Logger, Post, SetMetadata, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../strategy';
import { TripService } from './trip.service';
import * as ITrip from '../interfaces';
import * as Euser from '../enums';
import { RoleGuard } from '../guards/local-guard';
import { CreateTripDto } from './dto';

@Controller('trips')
export class TripController {
  private readonly logger: Logger = new Logger('TripController');

  constructor(private readonly tripService: TripService) {}

  @Get('/usertest')
  @SetMetadata('roles', [Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getRequest(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload): Promise<string> {
    this.logger.log(JSON.stringify(user), 'AdminTest');
    return this.tripService.getRequest();
  }

  @Post('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  createTrip(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Body(ValidationPipe) createTripDto: CreateTripDto): Promise<ITrip.ResponseBase> {
    return this.tripService.createTrip(user, createTripDto);
  }
}
