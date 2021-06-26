import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ormConfig } from './config/orm.config';
import { TripModule } from './trips/trip.module';
import { PostModule } from './posts/post.module';
import { EventStoreDBProvider } from './domains/databases/event-store-db.provider';
import { HealthController } from './healths/health.controller';
import { UserRepository } from './users/user.repository';
import { UserEventStoreRepository } from './domains/stores/user-event.store';
import { UserEventStoreProvider } from './domains/providers/user-event.provider';
import { TripKakfaConsumerService } from './domains/kafka-consumers/trip.consumer';

@Module({
  controllers: [HealthController],
  imports: [TypeOrmModule.forRoot(ormConfig), TripModule, PostModule, TerminusModule],
  providers: [...EventStoreDBProvider, UserRepository, UserEventStoreRepository, ...UserEventStoreProvider, TripKakfaConsumerService],
  exports: [...EventStoreDBProvider],
})
export class AppModule {}
