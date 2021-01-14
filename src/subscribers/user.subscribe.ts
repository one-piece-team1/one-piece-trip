import { Injectable, Logger } from '@nestjs/common';
import { UserCreditDto } from 'users/dto';
import { UserRepository } from 'users/user.repository';
import { AMQPHandlerFactory } from 'rabbitmq';
import * as Event from '../events';

interface IReceiveEvent {
  type: Event.UserEvent;
  data: UserCreditDto;
}

@Injectable()
export class EventSubscribers {
  private readonly logger: Logger = new Logger('EventSubscribers');
  private readonly onepieceUserExchange: string = 'onepiece-user';

  constructor(private readonly userRepository: UserRepository) {
    this.listen();
  }

  listen() {
    AMQPHandlerFactory.createSub(
      'onepiece_user_queue',
      this.onepieceUserExchange,
    )
      .then(event => this.execute(event))
      .catch(err => this.logger.log(err.message));
  }

  execute(event) {
    const jsonEvent: IReceiveEvent = JSON.parse(event);
    switch (jsonEvent.type) {
      case Event.UserEvent.CREATEUSER:
        return this.userRepository.signUp(jsonEvent.data);
    }
  }
}
