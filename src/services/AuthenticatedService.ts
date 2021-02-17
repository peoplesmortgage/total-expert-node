import { Container } from 'typedi';
import Authentication from './Authentication';

abstract class AuthenticatedService {
  protected auth: Authentication;

  protected urlSlug: string;

  constructor(urlSlug: string) {
    this.auth = Container.get(Authentication);
    this.urlSlug = urlSlug;
  }
}

export default AuthenticatedService;
