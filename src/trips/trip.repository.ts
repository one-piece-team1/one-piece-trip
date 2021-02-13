import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Not, Equal, Like, Repository } from 'typeorm';
import { Trip } from './trip.entity';
import * as ITrip from '../interfaces';
import { GetTripByIdDto, GetTripByPagingDto } from './dto';

@EntityRepository(Trip)
export class TripRepository extends Repository<Trip> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('TripRepository');

  /**
   * @description Create Trip Repo layer
   * @public
   * @param {ITrip.ICreateTrip} tripData
   * @returns {Promise<Trip>}
   */
  public async createTrip(tripData: ITrip.ICreateTrip): Promise<Trip> {
    const { startDate, endDate, publisher, startPoint, endPoint, publicStatus, companyName, shipNumber, geom } = tripData;
    const trip = new Trip();
    trip.startDate = new Date(startDate);
    trip.endDate = new Date(endDate);
    trip.publicStatus = publicStatus;
    if (companyName) trip.companyName = companyName;
    if (shipNumber) trip.shipNumber = shipNumber;
    if (geom) trip.geom = geom;
    trip.publisher = publisher;
    trip.startPoint = startPoint;
    trip.endPoint = endPoint;
    try {
      await trip.save();
    } catch (error) {
      this.logger.log(error.message, 'CreateTripError');
      throw new InternalServerErrorException(error);
    }
    return trip;
  }

  /**
   * @description Verify Trip for specific user
   * @public
   * @param {string} id
   * @returns {Promise<Trip>}
   */
  public async verifyByTripById(id: string): Promise<Trip> {
    const query = this.createQueryBuilder('trip');
    query.leftJoinAndSelect('trip.publisher', 'publisher');
    query.andWhere('trip.id = :id', { id });
    try {
      return query.getOne();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Get trip by id and left join post data
   * @public
   * @param {GetTripByIdDto} getTripByIdDto
   * @returns {Promise<Trip>}
   */
  public async getTripById(getTripByIdDto: GetTripByIdDto): Promise<Trip> {
    const query = this.createQueryBuilder('trip');
    query.leftJoinAndSelect('trip.posts', 'posts');
    query.andWhere('trip.id = :id', { id: getTripByIdDto.id });
    try {
      return query.getOne();
    } catch (error) {
      this.logger.log(error.message, 'GetTripByIdError');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Get trips by paging and search optioning by selfQuerying or not
   * - Self Query means if user is doing paging-query for it's own trip or not
   * @public
   * @param {GetTripByPagingDto} getTripByPagingDto
   * @param {boolean} isSelfQuerying
   * @returns {Promise<{ trips: Trip[]; count: number }>}
   */
  public async getTripByPaging(getTripByPagingDto: GetTripByPagingDto, isSelfQuerying: boolean): Promise<{ trips: Trip[]; count: number }> {
    const take = getTripByPagingDto.take ? Number(getTripByPagingDto.take) : 10;
    const skip = getTripByPagingDto.skip ? Number(getTripByPagingDto.skip) : 0;

    const searchOpts: ITrip.IQueryPaging = {
      take,
      skip,
      order: {
        updatedAt: getTripByPagingDto.sort,
      },
      where: {},
    };
    // if true querying self own paging otherwise querying others paging
    if (isSelfQuerying) {
      searchOpts.where.publisher = Equal(getTripByPagingDto.publisherId);
    } else {
      searchOpts.where.publisher = Not(getTripByPagingDto.publisherId);
    }

    // don't have idea which column should use keyword search
    // if (getTripByPagingDto.keyword.length > 0) {
    //   searchOpts.where.username = Like('%' + getTripByPagingDto.keyword + '%');
    // }

    try {
      const [trips, count] = await this.repoManager.findAndCount(Trip, searchOpts);
      return {
        trips,
        count,
      };
    } catch (error) {
      this.logger.log(error.message, 'GetTripByPaging');
      throw new InternalServerErrorException(error.message);
    }
  }
}
