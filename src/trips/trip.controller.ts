import { Controller, Get, Logger, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './get-user.decorator';
import { TripService } from './trip.service';
import * as IUser from '../interfaces';
import * as Euser from '../enums';
import { RoleGuard } from 'guards/local-guard';

@Controller('trips')
export class TripController {
  private readonly logger: Logger = new Logger('TripController');

  constructor(private readonly tripService: TripService) {}

  @Get('/usertest')
  @SetMetadata('roles', [Euser.EUserRole.USER])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getRequest(@CurrentUser() user: IUser.UserInfo): Promise<string> {
    this.logger.log(user);
    return this.tripService.getRequest();
  }
}
