import { Logger, NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { Location } from './relations';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly logger: Logger = new Logger('LocationRepository');

  /**
   * @description Find location by it's locationName
   * @public
   * @todo In the future locationName will be set to unique due to I'm not sure if all the port name is unique or not
   * - Waiting for Data engineer to provide more port data and verify data
   * @param {string} locationName
   * @returns {Promise<Location>}
   */
  public async findLocationByLocationName(locationName: string): Promise<Location> {
    try {
      const location = await this.findOne({ where: { locationName } });
      if (!location) throw new NotFoundException();
      return location;
    } catch (error) {
      this.logger.log(error.message, 'FindLocationById');
      throw new Error(error.message);
    }
  }
}
