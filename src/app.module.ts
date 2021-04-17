import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ormConfig } from './config/orm.config';
import { TripModule } from './trips/trip.module';
import { PostModule } from './posts/post.module';
import { HealthController } from './healths/health.controller';

@Module({
  controllers: [HealthController],
  imports: [TypeOrmModule.forRoot(ormConfig), TripModule, PostModule, TerminusModule],
})
export class AppModule {}
