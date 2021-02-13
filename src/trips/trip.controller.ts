import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, Query, Req, SetMetadata, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CurrentUser } from '../strategy';
import { TripService } from './trip.service';
import * as ITrip from '../interfaces';
import * as Euser from '../enums';
import { RoleGuard } from '../guards/local-guard';
import { CreateTripDto, GetTripByIdDto, GetTripByPagingDto } from './dto';

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

  @Get('/paging')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getTripByPaging(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Query(ValidationPipe) getTripByPagingDto: GetTripByPagingDto) {
    return this.tripService.getTripByPaging(user, getTripByPagingDto);
  }

  @Get('/:id/publishers/:publisherId')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getTripById(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Param(ValidationPipe) getTripByIdDto: GetTripByIdDto): Promise<ITrip.ResponseBase> {
    return this.tripService.getTripById(user, getTripByIdDto);
  }

  @Post('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  createTrip(@Req() req: Request, @CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Body(ValidationPipe) createTripDto: CreateTripDto): Promise<ITrip.ResponseBase> {
    return this.tripService.createTrip(req, user, createTripDto);
  }
}
