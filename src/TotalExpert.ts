import { Service, Container } from 'typedi';
import { TotalExpertInit } from './types';
import {
  AUTH_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET,
  ENVIRONMENT,
  ON_AUTHENTICATE,
} from './utils';
import Loans from './services/Loans';

@Service()
class TotalExpert {
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

    this.loans = Container.get(Loans);
  }
}

export default TotalExpert;
