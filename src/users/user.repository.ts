import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Repository, EntityRepository, getManager, EntityManager, Not } from 'typeorm';
import { User } from './user.entity';
import * as IUser from '../interfaces';
import { DeleteUserEventDto, UpdatePasswordEventDto, UpdateUserAdditionalInfoPublishDto } from './dto';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger = new Logger('UserRepository');

  /**
   * @description async createUser Event
   * @event
   * @public
   * @param {User} userReq
   * @returns {void}
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

  /**
   * @description Update user password
   * @event
   * @public
   * @param {UpdatePasswordEventDto} updatePasswordEventDto
   * @returns {void}
   */
  public updateUserPassword(updatePasswordEventDto: UpdatePasswordEventDto): void {
    const { id, salt, password } = updatePasswordEventDto;
    this.repoManager
      .getRepository(User)
      .update(id, { salt, password })
      .catch((err) => this.logger.log(err.message, 'UpdateUserPassword'));
  }

  /**
   * @description Update user additional info
   * @event
   * @public
   * @param {UpdateUserAdditionalInfoPublishDto} updateUserAdditionalInfoPublishDto
   * @returns {void}
   */
  public updateUserAdditionalInfo(updateUserAdditionalInfoPublishDto: UpdateUserAdditionalInfoPublishDto) {
    const { id, gender, age, desc, profileImage } = updateUserAdditionalInfoPublishDto;
    this.repoManager
      .getRepository(User)
      .update(id, { gender, age, desc, profileImage })
      .catch((err) => this.logger.log(err.message, 'UpdateUserAdditionalInfo'));
  }

  /**
   * @description Soft delete user
   * @event
   * @public
   * @param {DeleteUserEventDto} deleteUserEventDto
   * @returns {void}
   */
  public softDeleteUser(deleteUserEventDto: DeleteUserEventDto): void {
    const { id } = deleteUserEventDto;
    this.repoManager
      .getRepository(User)
      .update(id, { status: false })
      .catch((err) => this.logger.log(err.message, 'SoftDeleteUser'));
  }
}
