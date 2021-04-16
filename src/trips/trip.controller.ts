import { Request } from 'express';
import { Body, Controller, Get, HttpException, Param, Post, Query, Req, SetMetadata, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../guards/local-guard';
import { CurrentUser } from '../strategy';
import { Trip } from './trip.entity';
import { TripService } from './trip.service';
import { CreateTripDto, GetTripByIdDto, GetTripByPagingDto } from './dto';
import * as ITrip from '../interfaces';
import * as Euser from '../enums';

@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  /**
   * @description Health Check use
   * @healthcheck
   * @public
   * @returns {string}
   */
  // health check only duplicate testing
  /* istanbul ignore next */
  @Get('/')
  getRequest(): string {
    return this.tripService.getRequest();
  }

  /**
   * @description Get trips result with paging
   * @routes
   * @get
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {GetTripByPagingDto} getTripByPagingDto
   * @returns {Promise<ITrip.IResponseBase<ITrip.ITripPagingResponseBase<Trip[]>> | HttpException>}
   */
  @Get('/paging')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getTripByPaging(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Query(ValidationPipe) getTripByPagingDto: GetTripByPagingDto): Promise<ITrip.IResponseBase<ITrip.ITripPagingResponseBase<Trip[]>> | HttpException> {
    return this.tripService.getTripByPaging(user, getTripByPagingDto);
  }

  /**
   * @description Get Trip by primary key
   * @routes
   * @get
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {GetTripByIdDto} getTripByIdDto
   * @returns {Promise<ITrip.IResponseBase<Trip> | HttpException>}
   */
  @Get('/:id/publishers/:publisherId')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getTripById(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Param(ValidationPipe) getTripByIdDto: GetTripByIdDto): Promise<ITrip.IResponseBase<Trip> | HttpException> {
    return this.tripService.getTripById(user, getTripByIdDto);
  }

  /**
   * @description Create new trip
   * @routes
   * @post
   * @public
   * @param {Request} req
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {CreateTripDto} createTripDto
   * @returns {Promise<ITrip.IResponseBase<Trip> | HttpException>}
   */
  @Post('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  createTrip(@Req() req: Request, @CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Body(ValidationPipe) createTripDto: CreateTripDto): Promise<ITrip.IResponseBase<Trip> | HttpException> {
    return this.tripService.createTrip(req, user, createTripDto);
  }
}
