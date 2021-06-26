import { Injectable, Inject } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { UserEvent } from '../entities/user-event.entity';

@Injectable()
export class UserEventStoreRepository {
  public constructor(
    @Inject('USEREVENT_REPOSITORY')
    private repository: Repository<UserEvent>,
  ) {}

  public async allAllUserEvent(): Promise<UserEvent[]> {
    return await this.repository.find();
  }

  public async getUserEventById(id: string): Promise<UserEvent> {
    return await this.repository.findOne(id);
  }

  public async register(data: unknown, id: string): Promise<UserEvent | Error> {
    return await this.updateEvent(id, data);
  }

  private async updateEvent(id: string, UserEventEntity: unknown): Promise<(DeepPartial<UserEvent> & UserEvent) | Error> {
    try {
      await this.repository
        .createQueryBuilder()
        .useTransaction(true)
        .setLock('pessimistic_write')
        .update(UserEvent)
        .whereInIds(id)
        .set({
          topics: () => `array_cat("topics"::varchar[], Array[:topic]::varchar[])`,
        })
        .setParameter('topic', UserEventEntity['topic'])
        .execute();
      return await this.repository.findOne(id);
    } catch (error) {
      return new Error(error);
    }
  }
}
