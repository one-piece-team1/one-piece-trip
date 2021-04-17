import { Logger, NotFoundException } from '@nestjs/common';
import { EntityRepository, getRepository, Repository } from 'typeorm';
import { Location } from './relations';
import { config } from '../../config';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly connectionName: string = config.ENV === 'test' ? 'testConnection' : 'default';
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
      const location = await getRepository(Location, this.connectionName).findOne({ where: { locationName } });
      if (!location) throw new NotFoundException();
      return location;
    } catch (error) {
      this.logger.error(error.message, '', 'FindLocationByLocationNameErrpr');
      throw new Error(error.message);
    }
  }
}
