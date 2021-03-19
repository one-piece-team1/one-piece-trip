export interface ResponseBase {
  statusCode: number;
  status: 'error' | 'success';
  message: any;
  [futureKey: string]: any;
}

export interface SignInResponse extends ResponseBase {
  accessToken?: string;
}

type Status = 'error' | 'success';
export interface IResponseBase<T> {
  status: Status;
  statusCode: number;
  message?: T;
}

export interface IPagingResponse {
  take: number;
  skip: number;
  count: number;
}

export interface IPostPagingResponseBase<T> extends IPagingResponse {
  posts: T;
}
