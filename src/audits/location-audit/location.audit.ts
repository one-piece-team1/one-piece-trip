import { InternalServerErrorException } from '@nestjs/common';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { Location } from '../../locations/relations/location.entity';
import { LocationAuditLog } from './location-audit.entity';
import * as EAudit from '../enums';

@EventSubscriber()
export class LocationAuditSubscriber implements EntitySubscriberInterface<Location> {
  /**
   * @description Listen to location entity changing
   * @public
   * @returns {Location}
   */
  public listenTo() {
    return Location;
  }

  /**
   * @description Called after entity insertion
   * @event
   * @create
   * @public
   * @param {InsertEvent<Location>} event
   */
  public afterInsert(event: InsertEvent<Location>) {
    this.insertCreateEvent(event.entity);
  }

  /**
   * @description Called after entity update
   * @event
   * @update
   * @public
   * @param {UpdateEvent<Location>} event
   */
  public afterUpdate(event: UpdateEvent<Location>) {
    this.insertUpdateEvent(event);
  }

  /**
   * @description Called after entity delete
   * @event
   * @remove
   * @public
   * @param {RemoveEvent<Location>} event
   */
  public afterRemove(event: RemoveEvent<Location>) {
    this.insertDeleteEvent(event.entity);
  }

  /**
   * @description Insert create location log
   * @private
   * @param {Location} event
   */
  private async insertCreateEvent(event: Location) {
    const auditLog = new LocationAuditLog();
    auditLog.version = event.version;
    auditLog.locationId = event.id;
    auditLog.type = EAudit.EAduitType.CREATE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert update location log
   * @private
   * @param {UpdateEvent<Location>} event
   */
  private async insertUpdateEvent(event: UpdateEvent<Location>) {
    const auditLog = new LocationAuditLog();
    auditLog.version = event.entity.version;
    auditLog.locationId = event.entity.id;
    auditLog.type = EAudit.EAduitType.UPDATE;
    auditLog.updateAlias = event.updatedColumns.map((col) => col.databaseName).join(',');
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert delete location log
   * @public
   * @param {Location} event
   */
  private async insertDeleteEvent(event: Location) {
    const auditLog = new LocationAuditLog();
    auditLog.version = event.version;
    auditLog.locationId = event.id;
    auditLog.type = EAudit.EAduitType.DELETE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
