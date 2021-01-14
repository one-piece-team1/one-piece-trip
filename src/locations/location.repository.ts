import { Logger } from '@nestjs/common';
import {
  EntityManager,
  EntityRepository,
  getManager,
  Repository,
} from 'typeorm';
import { Location } from './relations';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('LocationRepository');
}
