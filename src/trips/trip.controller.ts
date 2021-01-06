import {
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AMQPHandlerFactory, AMQPHandler } from '../rabbitmq';
import { TripService } from './trip.service';

@Controller('trips')
export class TripController {
  constructor(
    private readonly tripService: TripService,
    private readonly tripPubSubHandler: AMQPHandler,
  ) {}

  @Get()
  @UsePipes(ValidationPipe)
  getRequest(): Promise<string> {
    return this.tripService.getRequest();
  }

  @Post('/pubtest')
  postTripPubTest(): void {
    this.tripPubSubHandler.publishData({ Hello: 'world' });
  }
}
