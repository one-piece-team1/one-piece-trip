import { Injectable } from '@nestjs/common';

@Injectable()
export class TripService {
  public async getRequest(): Promise<string> {
    return 'Hello World!';
  }
}
