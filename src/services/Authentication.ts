/* eslint-disable camelcase */
import { Service, Inject, Container } from 'typedi';
import fetch, { RequestInit, Response } from 'node-fetch';
import { TotalExpertInit } from '../types';
import {
  ENVIRONMENT,
  CLIENT_SECRET,
  CLIENT_ID,
  ON_AUTHENTICATE,
  ON_AUTHENTICATE_FAILURE,
  AUTH_TOKEN,
} from '../utils';

type GrantType = 'client_credentials' | 'authorization_code' | 'refresh_token';

type BasicAuthOptions = {
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
};

@Service()
class Authentication {
  #accessToken: TotalExpertInit['accessToken'];

  #authenticationPromise: Promise<Response> | null;

  @Inject(ENVIRONMENT)
  environment!: string;

  @Inject(CLIENT_SECRET)
  clientSecret!: string;

  @Inject(CLIENT_ID)
  clientId!: string;

  constructor() {
    const accessToken: string = Container.get(AUTH_TOKEN);
    this.#accessToken = accessToken;
    this.#authenticationPromise = null;
  }

  setAccessToken(token: TotalExpertInit['accessToken']): void {
    this.#accessToken = token;
  }

  getAccessToken(): TotalExpertInit['accessToken'] {
    return this.#accessToken;
  }

  private createBasicAuthOptions(
    grantType: GrantType,
    bodyAdditions: BasicAuthOptions = {},
  ): { uri: string, options: RequestInit } {
    const encodedCredentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const uri = `${this.environment}/v1/token`;
    const options = {
      method: 'POST',
      redirect: 'follow' as RequestInit['redirect'],
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: grantType, ...bodyAdditions }),
    };
    return { uri, options };
  }

  private determineAuthPromise(): Promise<Response> {
    if (this.#authenticationPromise) {
      return this.#authenticationPromise;
    }
    const { uri, options } = this.createBasicAuthOptions('client_credentials');
    const activeAuthPromise = fetch(uri, options);
    this.#authenticationPromise = activeAuthPromise;
    return activeAuthPromise;
  }

  async authenticate() {
    try {
      const response = await this.determineAuthPromise();
      if (!response.bodyUsed) {
        const { access_token } = await response.json();
        this.setAccessToken(access_token);
      }
      this.#authenticationPromise = null;
    } catch (error) {
      this.#authenticationPromise = null;
      throw error;
    }
  }

  async tokenFromAuthCode(code: string, redirect_uri: string): Promise<Response> {
    const { uri, options } = this.createBasicAuthOptions(
      'authorization_code',
      { code, redirect_uri },
    );
    const response = await fetch(uri, options);
    return response;
  }

  async refreshToken(refresh_token: string): Promise<Response> {
    const { uri, options } = this.createBasicAuthOptions('refresh_token', { refresh_token });
    const response = await fetch(uri, options);
    return response;
  }

  private async handleAuth(): Promise<void> {
    const onAuthenticate: TotalExpertInit['onAuthenticate'] = Container.get(ON_AUTHENTICATE);
    if (onAuthenticate) {
      await onAuthenticate(this as Authentication);
      return;
    }
    await this.authenticate();
  }

  private async handleAuthFailure(): Promise<void> {
    const onAuthFailure: TotalExpertInit['onAuthenticateFailure'] = Container.get(ON_AUTHENTICATE_FAILURE);
    if (onAuthFailure) {
      await onAuthFailure(this as Authentication)
        .catch((error) => {
          throw error;
        });
    } else {
      this.setAccessToken(null);
    }
  }

  async withAuthFetch(
    fetchUrl: string,
    fetchOpts: RequestInit = {},
    skipRetry: boolean = false,
  ): Promise<Response> {
    const authError = new Error('401_UNAUTHORIZED_CAN_RETRY');
    const makeRequest = async (isRetry: boolean): Promise<Response> => {
      try {
        if (!this.#accessToken) {
          await this.handleAuth();
        }
        const uri = `${this.environment}${fetchUrl}`;
        const providedHeaders = fetchOpts.headers ? fetchOpts.headers : {};
        const options = {
          ...fetchOpts,
          headers: {
            'Content-Type': 'application/json',
            ...providedHeaders,
            Authorization: `Bearer ${this.#accessToken}`,
          },
        };
        const response = await fetch(uri, options);
        if (response.status === 401) {
          throw authError;
        }
        return response;
      } catch (error) {
        if (error === authError && !isRetry) {
          await this.handleAuthFailure();
          return makeRequest(true);
        }
        throw error;
      }
    };
    const result = await makeRequest(skipRetry);
    return result;
  }
}

export default Authentication;
