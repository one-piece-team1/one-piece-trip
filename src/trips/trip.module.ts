import { Module } from '@nestjs/common';
import { AMQPHandler } from 'rabbitmq';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';

@Module({
  imports: [],
  controllers: [TripController],
  providers: [TripService, AMQPHandler],
})
export class TripModule {}
