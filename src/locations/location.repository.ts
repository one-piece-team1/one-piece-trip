import { Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { Location } from './relations';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('LocationRepository');

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
