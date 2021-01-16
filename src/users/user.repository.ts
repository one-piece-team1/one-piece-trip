import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Repository, EntityRepository, getManager, EntityManager, Not } from 'typeorm';
import { User } from './user.entity';
import * as IUser from '../interfaces';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger = new Logger('UserRepository');

  /**
   *  @description async createUser Event
   */
  public createUser(userReq: User): void {
    this.repoManager.save(User, userReq).catch((err) => this.logger.log(err.message, 'CreatUser'));
  }

  /**
   * @description Get User By Id
   * @public
   * @param {string} id
   * @param {boolean} isAdmin
   * @returns {Promise<User>}
   */
  public async getUserById(id: string, isAdmin: boolean): Promise<User> {
    try {
      const findOpts: IUser.IFindOne = {
        where: {
          id,
          status: true,
        },
      };
      // only admin can view admin data
      // trial, user, vip can view each others data except admin data
      if (!isAdmin) findOpts.where.role = Not('admin');

      const user: User = await this.findOne(findOpts);
      if (!user) throw new NotFoundException();
      delete user.password;
      delete user.salt;
      return user;
    } catch (error) {
      this.logger.log(error.message, 'GetUserById');
      throw new InternalServerErrorException(error.message);
    }
  }
}
