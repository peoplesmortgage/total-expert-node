import { Service, Container } from 'typedi';
import { RequestInit, Response } from 'node-fetch';
import { TotalExpertInit } from './types';
import {
  AUTH_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET,
  ENVIRONMENT,
  ON_AUTHENTICATE,
} from './utils';
import { Loans, Authentication } from './services';

@Service()
class TotalExpert {
  authentication: Authentication;

  loans: Loans;

  constructor({
    environment,
    clientId,
    clientSecret,
    accessToken,
    onAuthenticate,
  }: TotalExpertInit) {
    const hasReqiuredArgs = [clientId, clientSecret].every((value) => Boolean(value));
    if (!hasReqiuredArgs) {
      throw new Error('the clientId and clientSecret values are required in the Total Expert constructor');
    }
    Container.set(CLIENT_ID, clientId);
    Container.set(CLIENT_SECRET, clientSecret);
    Container.set(ENVIRONMENT, environment || 'https://public.totalexpert.net/');
    Container.set(AUTH_TOKEN, accessToken || '');
    Container.set(ON_AUTHENTICATE, onAuthenticate || null);

    this.authentication = Container.get(Authentication);
    this.loans = Container.get(Loans);
  }

  async fetch(url: string, options: RequestInit = {}, skipRetry: boolean): Promise<Response> {
    const response = await this.authentication.withAuthFetch(url, options, skipRetry);
    return response;
  }

  // (short and stout)
  async teapot(): Promise<Response> {
    const response = await this.authentication.withAuthFetch('v1/teapot');
    return response;
  }
}

export default TotalExpert;
