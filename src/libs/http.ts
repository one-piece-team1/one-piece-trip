import httpRequest from 'request-promise';

export class StandardRequest {
  /**
   * @description Standard Http Request
   * @param {any} options
   */
  makeRequest(options: any) {
    return new Promise((resolve, reject) => {
      if (options.method === 'GET' || options.method === 'get') {
        httpRequest
          .get(options.url, {
            headers: options.headers,
            timeout: options.timeout,
            json: true,
          })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      }
    });
  }
}
