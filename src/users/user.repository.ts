import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Repository, EntityRepository, getManager, EntityManager, Not, getRepository } from 'typeorm';
import { User } from './user.entity';
import * as IUser from '../interfaces';
import { DeleteUserEventDto, UpdatePasswordEventDto, UpdateUserAdditionalInfoPublishDto } from './dto';
import { config } from '../../config';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private readonly logger = new Logger('UserRepository');
  private readonly connectionName: string = config.ENV === 'test' ? 'testConnection' : 'default';

  /**
   * @description async createUser Event
   * @event
   * @public
   * @param {User} userReq
   * @returns {Promise<User>}
   */
  public async createUser(userReq: User): Promise<User> {
    try {
      const user = new User();
      Object.assign(user, userReq);
      return await user.save();
    } catch (error) {
      throw new Error(error.message);
    }
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

      const user: User = await getRepository(User, this.connectionName).findOne(findOpts);
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
   * @returns {Promise<User>}
   */
  public async updateUserPassword(updatePasswordEventDto: UpdatePasswordEventDto): Promise<User> {
    const { id, salt, password } = updatePasswordEventDto;
    try {
      const user = await getRepository(User, this.connectionName).findOne({ id });
      user.salt = salt;
      user.password = password;
      return await user.save();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * @description Update user additional info
   * @event
   * @public
   * @param {UpdateUserAdditionalInfoPublishDto} updateUserAdditionalInfoPublishDto
   * @returns {Promise<User>}
   */
  public async updateUserAdditionalInfo(updateUserAdditionalInfoPublishDto: UpdateUserAdditionalInfoPublishDto): Promise<User> {
    const { id, gender, age, desc, profileImage } = updateUserAdditionalInfoPublishDto;
    try {
      const user = await getRepository(User, this.connectionName).findOne({ id });
      if (gender) user.gender = gender;
      if (age) user.age = age;
      if (desc) user.desc = desc;
      if (profileImage) user.profileImage = profileImage;
      return await user.save();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * @description Soft delete user
   * @event
   * @public
   * @param {DeleteUserEventDto} deleteUserEventDto
   * @returns {Promise<User>}
   */
  public async softDeleteUser(deleteUserEventDto: DeleteUserEventDto): Promise<User> {
    const { id } = deleteUserEventDto;
    try {
      const user = await getRepository(User, this.connectionName).findOne({ id });
      user.status = false;
      return await user.save();
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
