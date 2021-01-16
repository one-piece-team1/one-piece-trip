import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserRepository } from 'users/user.repository';
import { AMQPHandlerFactory } from '../rabbitmq';
import * as Event from '../events';
import { User } from '../users/user.entity';

interface IReceiveEvent {
  type: Event.UserEvent;
  data: User;
}

/**
 * @classdesc RMQ user event subscribe
 */
@Injectable()
export class TripEventSubscribers {
  private readonly logger: Logger = new Logger('TripEventSubscribers');
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly onepieceTripExchange: string = 'onepiece-trip';

  constructor(private readonly userRepository: UserRepository) {
    this.listen();
  }

  /**
   * @description listen to RMQ sub event
   */
  listen() {
    AMQPHandlerFactory.createSub('onepiece_trip_queue', this.onepieceTripExchange)
      .then((event) => {
        console.log("check_evt: ", event)
        this.execute(event)
      })
      .catch((err) => this.logger.log(err.message));
  }

  /**
   * @description Excute sub event and assign to responsable repository handler
   * @param {string} event
   */
  execute(event) {
    const jsonEvent: IReceiveEvent = JSON.parse(event);
    switch (jsonEvent.type) {
      case Event.UserEvent.CREATEUSER:
        return this.userRepository.createUser(jsonEvent.data);
    }
  }
}
