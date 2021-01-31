import * as amqp from 'amqplib/callback_api';
import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../users/user.repository';
import { config } from '../../config';
import * as Event from '../events';
import { User } from '../users/user.entity';
import { UpdatePasswordEventDto, DeleteUserEventDto, UpdateUserAdditionalInfoPublishDto } from '../users/dto';

interface IReceiveEvent {
  type: Event.UserEvent;
  data: User | UpdatePasswordEventDto | DeleteUserEventDto;
}

/**
 * @classdesc RMQ user event subscribe
 */
@Injectable()
export class TripEventSubscribers {
  private readonly logger: Logger = new Logger('TripEventSubscribers');
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly defaultExchangeName: string = 'onepiece-trip';

  constructor(private readonly userRepository: UserRepository) {
    this.subscribeData('onepiece_trip_queue');
  }

  /**
   * @description Sub Data
   * @public
   * @param {string} queueName
   * @returns {Promise<unknown>}
   */
  subscribeData(queueName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      amqp.connect(`${config.EVENT_STORE_SETTINGS.protocol}://${config.EVENT_STORE_SETTINGS.hostname}:${config.EVENT_STORE_SETTINGS.tcpPort}/?heartbeat=60`, (connectErr: Error, connection: amqp.Connection) => {
        if (connectErr) return reject(connectErr.message);

        connection.createChannel((createChErr: Error, channel: amqp.Channel) => {
          if (createChErr) return reject(createChErr.message);
          channel.assertExchange(this.defaultExchangeName, 'fanout', {
            durable: false,
          });

          channel.assertQueue(
            queueName,
            {
              exclusive: true,
            },
            (assertErr: Error, q: amqp.Replies.AssertQueue) => {
              if (assertErr) return reject(assertErr.message);
              channel.bindQueue(q.queue, this.defaultExchangeName, '');
              channel.consume(
                q.queue,
                (msg: amqp.Message) => {
                  this.logger.log(msg.content.toString(), 'AMQPHandler-SubscribeData');
                  if (msg.content) {
                    this.execute(msg.content.toString());
                    resolve(true);
                  }
                },
                { noAck: true },
              );
            },
          );
        });
      });
    });
  }

  /**
   * @description Excute sub event and assign to responsable repository handler
   * @param {string} event
   */
  execute(event) {
    const jsonEvent: IReceiveEvent = JSON.parse(event);
    this.logger.log(event, 'TripEventSubscribers');
    switch (jsonEvent.type) {
      case Event.UserEvent.CREATEUSER:
        return this.userRepository.createUser(jsonEvent.data as User);
      case Event.UserEvent.UPDATEUSERPASSWORD:
        return this.userRepository.updateUserPassword(jsonEvent.data as UpdatePasswordEventDto);
      case Event.UserEvent.UPDATEUSERADDITIONALINFO:
        return this.userRepository.updateUserAdditionalInfo(jsonEvent.data as UpdateUserAdditionalInfoPublishDto);
      case Event.UserEvent.SOFTDELETEUSER:
        return this.userRepository.softDeleteUser(jsonEvent.data as DeleteUserEventDto);
    }
  }
}
