/* eslint-disable camelcase */
import { Service, Inject, Container } from 'typedi';
import fetch, { RequestInit, Response } from 'node-fetch';
import { TotalExpertInit } from '../types';
import {
  ENVIRONMENT,
  CLIENT_SECRET,
  CLIENT_ID,
  ON_AUTHENTICATE,
  AUTH_TOKEN,
} from '../utils';

@Service()
class Authentication {
  accessToken: TotalExpertInit['accessToken'];

  #tokenUrl: string;

  @Inject(ENVIRONMENT)
  environment!: string;

  @Inject(CLIENT_SECRET)
  clientSecret!: string;

  @Inject(CLIENT_ID)
  clientId!: string;

  @Inject(ON_AUTHENTICATE)
  onAuthenticate: TotalExpertInit['onAuthenticate'];

  constructor() {
    const accessToken: string = Container.get(AUTH_TOKEN);
    this.accessToken = accessToken;
    this.#tokenUrl = `${this.environment}/v1/token`;
  }

  setAccessToken(token: TotalExpertInit['accessToken']): void {
    this.accessToken = token;
  }

  async authenticate() {
    const encodedCredentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(this.#tokenUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    });
    // eslint-disable-next-line camelcase
    const { access_token } = await response.json();
    this.setAccessToken(access_token);
  }

  async handleAuth(): Promise<void> {
    const onAuthenticate: TotalExpertInit['onAuthenticate'] = Container.get(ON_AUTHENTICATE);
    if (onAuthenticate) {
      await onAuthenticate(this as Authentication);
      return;
    }
    await this.authenticate();
  }

  async withAuthFetch(
    fetchUrl: string,
    fetchOpts: RequestInit = {},
    skipRetry: boolean = false,
  ): Promise<Response> {
    const authError = new Error('401_UNAUTHORIZED_CAN_RETRY');
    const makeRequest = async (isRetry: boolean): Promise<Response> => {
      try {
        if (!this.accessToken) {
          await this.handleAuth();
        }
        const uri = `${this.environment}${fetchUrl}`;
        const providedHeaders = fetchOpts.headers ? fetchOpts.headers : {};
        const options = {
          ...fetchOpts,
          headers: {
            'Content-Type': 'application/json',
            ...providedHeaders,
            Authorization: `Bearer ${this.accessToken}`,
          },
        };
        const response = await fetch(uri, options);
        if (response.status === 401) {
          throw authError;
        }
        return response;
      } catch (error) {
        if (error === authError && !isRetry) {
          this.setAccessToken(null);
          return makeRequest(true);
        }
        throw error;
      }
    };
    const result = await makeRequest(skipRetry);
    return result;
  }

  async tokenFromAuthCode(authCode: string, redirectUri: string): Promise<any> {
    const options: RequestInit = {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
      }),
    };
    const response = await this.withAuthFetch(this.#tokenUrl, options);
    const data = await response.text();
    return data;
  }

  async refreshToken(token: string): Promise<string> {
    const options: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'resfresh_token',
        refresh_token: token,
      }),
    };
    // this is making some assumptions right?
    const response = await this.withAuthFetch(this.#tokenUrl, options, true);
    const { access_token } = await response.json();
    return access_token as string;
  }
}

export default Authentication;
