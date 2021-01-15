import { Injectable, Logger } from '@nestjs/common';
import { UserCreditDto } from 'users/dto';
import { UserRepository } from 'users/user.repository';
import { AMQPHandlerFactory } from 'rabbitmq';
import * as Event from '../events';

interface IReceiveEvent {
  type: Event.UserEvent;
  data: UserCreditDto;
}

/**
 * @classdesc RMQ user event subscribe
 */
@Injectable()
export class EventSubscribers {
  private readonly logger: Logger = new Logger('EventSubscribers');
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly onepieceUserExchange: string = 'onepiece-trip';

  constructor(private readonly userRepository: UserRepository) {
    this.listen();
  }

  /**
   * @description listen to RMQ sub event
   */
  listen() {
    AMQPHandlerFactory.createSub('onepiece_trip_queue', this.onepieceUserExchange)
      .then((event) => this.execute(event))
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
        return this.userRepository.signUp(jsonEvent.data);
    }
  }
}
