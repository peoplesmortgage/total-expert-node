/* eslint-disable no-empty */
import 'reflect-metadata';
import { Container } from 'typedi';
import fetch from 'node-fetch';
import Authentication from '../../src/services/Authentication';
import {
  ENVIRONMENT,
  CLIENT_SECRET,
  CLIENT_ID,
  ON_AUTHENTICATE,
  ON_AUTHENTICATE_FAILURE,
  AUTH_TOKEN,
} from '../../src/utils';

jest.mock('node-fetch');

const mockFetch = fetch as unknown as jest.Mock;

describe('Authentication', () => {
  Container.set([
    { id: ENVIRONMENT, value: 'TEST_ENVIRONMENT' },
    { id: CLIENT_ID, value: 'TEST_CLIENT_ID' },
    { id: CLIENT_SECRET, value: 'TEST_CLIENT_SECRET' },
    { id: ON_AUTHENTICATE, value: null },
    { id: ON_AUTHENTICATE_FAILURE, value: null },
    { id: AUTH_TOKEN, value: '' },
  ]);
  const authInstance = Container.get(Authentication);

  const mockAccessToken = '<MOCK ACCCESS TOKEN>';
  const mockFetchResponse = (value?: any, status: number = 201): jest.Mock => {
    const mockResponseJson = jest.fn();
    if (status > 299 && status !== 401) {
      throw new Error('request error');
    }
    mockFetch.mockResolvedValueOnce({
      status,
      json: mockResponseJson.mockResolvedValueOnce(value),
    });
    return mockResponseJson;
  };
  const mockTokenFetchAnd401Times = (times: number) => {
    let i = 0;
    while (i < times) {
      mockFetchResponse('some value', 401);
      mockFetchResponse('<NEW TOKEN VALUE>');
      i += 1;
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockFetchResponse({ access_token: mockAccessToken });
    authInstance.setAccessToken('');
  });

  describe('withAuthFetch', () => {
    describe('without onAuthenticate or initialzed token', () => {
      it('attempts to authenticate before fetching a protected resource', async () => {
        mockFetchResponse({});
        expect(authInstance.getAccessToken()).toEqual('');
        await authInstance.withAuthFetch('/resource-url');
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(authInstance.getAccessToken()).toEqual(mockAccessToken);
      });

      it('will reauthenticate and refetch if it receives a 401 status', async () => {
        mockTokenFetchAnd401Times(1);
        mockFetchResponse();
        await authInstance.withAuthFetch('/some-resource-url');
        // 1. Get token (was not initialized with one)
        // 2. make resource request
        // 3. 401 causes a new token request
        // 4. re-request the resource
        expect(mockFetch).toHaveBeenCalledTimes(4);
      });

      it('will only attempted to reauthenticate once before throwing an error', async () => {
        mockTokenFetchAnd401Times(10);
        try {
          await authInstance.withAuthFetch('/some-resource-url');
        } catch (error) {}
        expect(mockFetch).toHaveBeenCalledTimes(4);
      });

      it('will not attempt to reauthenticate if the third argument is passed to fetchWithAuth', async () => {
        mockTokenFetchAnd401Times(10);
        try {
          await new Authentication().withAuthFetch('some/url', {}, true);
        } catch (error) {}
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('will include the provided headers in the fetch request', async () => {
        mockFetchResponse();
        const options = {
          headers: {
            merged: 'I was merged in!',
          },
        };
        await new Authentication().withAuthFetch('/test-url', options);
        const { headers } = mockFetch.mock.calls[1][1];
        expect(headers.merged).toEqual('I was merged in!');
      });
    });

    describe('with onAuthenticate function', () => {
      const mockOnAuthenticate = jest.fn();
      beforeAll(() => {
        Container.remove(ON_AUTHENTICATE);
        Container.set(ON_AUTHENTICATE, mockOnAuthenticate);
      });

      afterAll(() => {
        Container.remove(ON_AUTHENTICATE);
        Container.set(ON_AUTHENTICATE, null);
      });

      it('will call the onAuthenticate function before fetching a resource', async () => {
        mockFetchResponse();
        await new Authentication().withAuthFetch('/some-resource');
        expect(mockOnAuthenticate).toHaveBeenCalled();
      });

      it('calls the onAuthenticate function with the instance of the auth class', async () => {
        mockFetchResponse();
        await authInstance.withAuthFetch('/some-resource');
        expect(mockOnAuthenticate).toHaveBeenCalledWith(authInstance);
      });
    });

    describe('with onAuthenticateFailure function', () => {
      const mockOnAuthFailure = jest.fn();
      beforeAll(() => {
        Container.remove(ON_AUTHENTICATE_FAILURE);
        Container.set(ON_AUTHENTICATE_FAILURE, mockOnAuthFailure);
      });

      afterAll(() => {
        Container.remove(ON_AUTHENTICATE_FAILURE);
        Container.set(ON_AUTHENTICATE_FAILURE, null);
      });

      beforeEach(() => {
        mockTokenFetchAnd401Times(10);
      });

      it('will call the onAuthFailure function if it experienced a 401 and will retry', async () => {
        try {
          await new Authentication().withAuthFetch('/some-resource-url');
        } catch (error) {}
        expect(mockOnAuthFailure).toHaveBeenCalledTimes(1);
      });

      it('calls the onAuthFailure function with an instance of the authentication class', async () => {
        try {
          await authInstance.withAuthFetch('/some-resource');
        } catch (error) {}
        expect(mockOnAuthFailure).toHaveBeenCalledWith(authInstance);
      });

      it('catches the UnhandledPromiseRejection should one occur', async () => {
        const internalError = new Error('some error');
        mockOnAuthFailure.mockRejectedValueOnce(internalError);
        try {
          await authInstance.withAuthFetch('/some-resource');
        } catch (error) {
          expect(error).toEqual(internalError);
        }
      });
    });

    describe('with provided auth token', () => {
      const mockProvidedToken = '<MOCK_PROVIDED_TOKEN_VALUE>';
      beforeAll(() => {
        Container.remove(AUTH_TOKEN);
        Container.set(AUTH_TOKEN, mockProvidedToken);
      });

      afterAll(() => {
        Container.remove(AUTH_TOKEN);
        Container.set(AUTH_TOKEN, '');
      });

      it("will set the instance's token property to the one provided from the container", () => {
        expect(new Authentication().getAccessToken()).toEqual(mockProvidedToken);
      });

      it('will not attempt to fetch a new token if one is provided', async () => {
        mockFetchResponse();
        await new Authentication().withAuthFetch('/');
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('authenticate', () => {
    it('calls the token endpoint with a basic auth header', async () => {
      await authInstance.authenticate();
      expect(mockFetch.mock.calls[0]).toMatchSnapshot();
    });

    it("sets the instance's access token property when called successfully", async () => {
      await authInstance.authenticate();
      expect(authInstance.getAccessToken()).toEqual(mockAccessToken);
    });

    it('removes the authenticationPromise value when complete', async () => {
      await authInstance.authenticate();
      expect(authInstance).toMatchSnapshot();
    });

    it('removes the authenticationPromise value when an error occurs', async () => {
      mockFetch.mockReset();
      mockFetch.mockImplementationOnce(() => {
        throw new Error('oh no something went wrong');
      });
      expect(async () => {
        await authInstance.authenticate();
      }).rejects.toThrow();
      expect(authInstance).toMatchSnapshot();
    });

    it('will not call fetch again if there is already an in flight authentication promise', async () => {
      mockFetch.mockReset().mockResolvedValue({
        usedBody: false,
        json: async () => ({}),
      });
      await Promise.all([
        authInstance.authenticate(),
        authInstance.authenticate(),
        authInstance.authenticate(),
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('will not attempt read the token in the response if the bodyUsed value is set', async () => {
      const mockJson = jest.fn();
      mockFetch.mockReset().mockResolvedValueOnce({
        bodyUsed: true,
        json: mockJson,
      });
      await authInstance.authenticate();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe('tokenFromAuthCode', () => {
    it('provides the auth code and the redirect uri in the request to the token endpoint', async () => {
      mockFetchResponse();
      await authInstance.tokenFromAuthCode('<AUTH CODE>', '<REDIRECT URL>');
      expect(mockFetch.mock.calls[0]).toMatchSnapshot();
    });
  });

  describe('refreshToken', () => {
    it('provides the refresh token and basic auth headers to the token endpoint', async () => {
      mockFetchResponse();
      await authInstance.refreshToken('<REFRESH_TOKEN>');
      expect(mockFetch.mock.calls[0]).toMatchSnapshot();
    });
  });
});
