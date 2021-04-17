import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PostService } from '../../posts/post.service';
import { PostRepository } from '../../posts/post.repository';
import { TripRepository } from '../../trips/trip.repository';
import { UserRepository } from '../../users/user.repository';
import { Post } from '../../posts/post.entity';
import { Uploader } from '../../libs/cloudinary';
import { PostHandlerFactory } from '../../handlers/post.handler';
import { MockCreateTrip, MockCreateUser, MockCreatePost } from '../../libs/mock_data';
import { CreatePostDto } from '../../posts/dto';
import * as EShare from '../../enums';
import * as IShare from '../../interfaces';

interface IServerCustomExpcetion {
  status: number;
  error: string;
}

jest.mock('../../handlers/post.handler');
describe('# Post Service', () => {
  let postService: PostService;
  let postRepository: PostRepository;
  let tripRepository: TripRepository;
  let userRepository: UserRepository;
  let uploader: Uploader;

  // mock
  let userMock: IShare.UserInfo | IShare.JwtPayload;
  let mockCreatePostDto: CreatePostDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PostRepository,
          useValue: {
            createPost: jest.fn(),
            getPostById: jest.fn(),
            getPosts: jest.fn(),
          },
        },
        {
          provide: TripRepository,
          useValue: {
            verifyByTripById: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            getUserById: jest.fn(),
          },
        },
        {
          provide: Uploader,
          useValue: {
            uploadBatch: jest.fn(),
          },
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
    postRepository = module.get<PostRepository>(PostRepository);
    tripRepository = module.get<TripRepository>(TripRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    uploader = module.get<Uploader>(Uploader);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should all instances to be created', () => {
    expect(postService).toBeDefined();
    expect(postRepository).toBeDefined();
    expect(tripRepository).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(uploader).toBeDefined();
  });

  describe('# Create Trip', () => {
    afterEach(() => {
      userMock = null;
      mockCreatePostDto = null;
    });

    it('Should be able to return forbidden custom error when user.id not eql to publisherId', async (done: jest.DoneCallback) => {
      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: uuidv4(),
        publisherId: uuidv4(),
      };
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const result = await postService.createPost(userMock, mockCreatePostDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse.error).toEqual('Invalid credential');
      done();
    });

    it('Should be able to return User not found custom error when user not existed', async (done: jest.DoneCallback) => {
      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: uuidv4(),
        publisherId: uuidv4(),
      };
      userMock = {
        id: mockCreatePostDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      userRepository.getUserById = jest.fn().mockReturnValueOnce(undefined);
      const result = await postService.createPost(userMock, mockCreatePostDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(resultResponse.error).toEqual('User not found');
      done();
    });

    it('Should be able to return Trip not found custom error when trip not existed', async (done: jest.DoneCallback) => {
      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: uuidv4(),
        publisherId: uuidv4(),
      };
      userMock = {
        id: mockCreatePostDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      const mockCreateUser = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(mockCreateUser);
      tripRepository.verifyByTripById = jest.fn().mockReturnValueOnce(undefined);
      const result = await postService.createPost(userMock, mockCreatePostDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(resultResponse.error).toEqual('Trip not found');
      done();
    });

    it('Should be able to return Invalid credential custom error when trip publisher is not same as request post user', async (done: jest.DoneCallback) => {
      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: uuidv4(),
        publisherId: uuidv4(),
      };
      userMock = {
        id: mockCreatePostDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      const mockCreateUser = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(mockCreateUser);
      const mockCreateTrip = MockCreateTrip();
      mockCreateTrip['publisher'] = {
        id: uuidv4(),
      };
      tripRepository.verifyByTripById = jest.fn().mockReturnValueOnce(mockCreateTrip);
      const result = await postService.createPost(userMock, mockCreatePostDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.FORBIDDEN);
      expect(resultResponse.error).toEqual('Invalid credential');
      done();
    });

    it('Should be able to create new post', async (done: jest.DoneCallback) => {
      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: uuidv4(),
        publisherId: uuidv4(),
      };
      userMock = {
        id: mockCreatePostDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      const mockCreateUser = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(mockCreateUser);
      const mockCreateTrip = MockCreateTrip();
      mockCreateTrip['publisher'] = userMock;
      tripRepository.verifyByTripById = jest.fn().mockReturnValueOnce(mockCreateTrip);
      const mockCreatePost = MockCreatePost();
      postRepository.createPost = jest.fn().mockReturnValueOnce(mockCreatePost);
      PostHandlerFactory.createPost = jest.fn().mockImplementation(() => ({}));
      const result = await postService.createPost(userMock, mockCreatePostDto);
      const resultResponse = result as IShare.IResponseBase<Post>;
      expect(resultResponse.statusCode).toEqual(HttpStatus.CREATED);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message['id']).toEqual(mockCreatePost.id);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      mockCreatePostDto = {
        content: 'test',
        publicStatus: EShare.ETripView.PUBLIC,
        tripId: uuidv4(),
        publisherId: uuidv4(),
      };
      userMock = {
        id: mockCreatePostDto.publisherId,
        username: 'test',
        licence: 'onepiece',
      };
      const mockCreateUser = MockCreateUser();
      userRepository.getUserById = jest.fn().mockReturnValueOnce(mockCreateUser);
      const mockCreateTrip = MockCreateTrip();
      mockCreateTrip['publisher'] = userMock;
      tripRepository.verifyByTripById = jest.fn().mockReturnValueOnce(mockCreateTrip);
      const mockCreatePost = MockCreatePost();
      postRepository.createPost = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await postService.createPost(userMock, mockCreatePostDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get Post By Id', () => {
    afterEach(() => {
      userMock = null;
    });

    it('Should be able to return Post not found custom error when post not existed', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const mockCreatePost = MockCreatePost();
      postRepository.getPostById = jest.fn().mockReturnValueOnce(undefined);
      const result = await postService.getPostById(userMock, mockCreatePost.id);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual(`Post ${mockCreatePost.id} not found`);
      done();
    });

    it('Should be able to get post by id', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const mockCreatePost = MockCreatePost();
      postRepository.getPostById = jest.fn().mockReturnValueOnce(mockCreatePost);
      const result = await postService.getPostById(userMock, uuidv4());
      const resultResponse = result as IShare.IResponseBase<Post>;
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message['id']).toEqual(mockCreatePost.id);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      postRepository.getPostById = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await postService.getPostById(userMock, uuidv4());
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get Posts with Paging', () => {
    afterEach(() => {
      userMock = null;
    });

    it('Should be able to return Post not found custom error when post not existed', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      postRepository.getPosts = jest.fn().mockReturnValueOnce({ posts: [], count: 0, take: 10, skip: 0 });
      const result = await postService.getPosts(userMock, {});
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual(`Post Not Found`);
      done();
    });

    it('Should be able to get posts with paging', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      const mockCreatePost = MockCreatePost();
      postRepository.getPosts = jest.fn().mockReturnValueOnce({ posts: [mockCreatePost], count: 1, take: 10, skip: 0 });
      const result = await postService.getPosts(userMock, {});
      const resultResponse = result as IShare.IResponseBase<IShare.IPostPagingResponseBase<Post[]>>;
      expect(resultResponse.statusCode).toEqual(HttpStatus.OK);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message.posts[0].id).toEqual(mockCreatePost.id);
      expect(resultResponse.message.take).toEqual(10);
      expect(resultResponse.message.count).toEqual(1);
      expect(resultResponse.message.skip).toEqual(0);
      done();
    });

    it('Should be able to return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      userMock = {
        id: uuidv4(),
        username: 'test',
        licence: 'onepiece',
      };
      postRepository.getPosts = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await postService.getPosts(userMock, {});
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });
});
