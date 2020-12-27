import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { TripService } from './trip.service';

@Controller('')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Get()
  @UsePipes(ValidationPipe)
  getRequest(): Promise<string> {
    return this.tripService.getRequest();
  }
}
