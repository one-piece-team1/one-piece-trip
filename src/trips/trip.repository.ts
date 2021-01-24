import { InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { Trip } from './trip.entity';
import * as ITrip from '../interfaces';

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
    const { startDate, endDate, publisher, startPoint, endPoint, publicStatus, companyName, shipNumber } = tripData;
    const trip = new Trip();
    trip.startDate = new Date(startDate);
    trip.endDate = new Date(endDate);
    trip.publicStatus = publicStatus;
    if (companyName) trip.companyName = companyName;
    if (shipNumber) trip.shipNumber = shipNumber;
    trip.publisher = publisher;
    trip.startPoint = startPoint;
    trip.endPoint = endPoint;
    try {
      await trip.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return trip;
  }

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
}
