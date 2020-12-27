import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TripModule } from './trips/trip.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from './config/orm.config';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig), TripModule],
})
export class AppModule {}
