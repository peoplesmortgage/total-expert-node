import { Container } from 'typedi';
import Authentication from './Authentication';
import { TotalExpertId } from '../types';

interface Response {
  
}

class ServiceWrapper<EntityInterface, E, K> {
  protected auth: Authentication;

  protected urlSlug: string;

  constructor(urlSlug: string) {
    this.auth = Container.get(Authentication);
    this.urlSlug = urlSlug;
  }

  protected async getToJSON(url: string): Promise<any> {
    const response = await this.auth.withAuthFetch(url);
    const data = await response.json();
    return data;
  }

  protected async create(providedData: { [key: string]: any }): Promise<EntityInterface> {
    const options = { method: 'POST', body: JSON.stringify(providedData) };
    const response = await this.auth.withAuthFetch(this.urlSlug, options);
    const data = await response.json();
    return data;
  }

  async get(id: TotalExpertId): Promise<EntityInterface> {
    const result = await this.getToJSON(`${this.urlSlug}/${id}`);
    return result;
  }

  async getMany(pageNumber: number = 1, pageSize: number = 10) {
    const url = `${this.urlSlug}?page[number]=${pageNumber}&page[size]=${pageSize}`;
    return this.getToJSON(url);
  }

  async createAsAdmin(loanData: any): Promise<any> {
    const result = await this.create(loanData);
    return result;
  }

  async createAsUser(loanData: any): Promise<any> {
    const result = await this.create(loanData);
    return result;
  }
}

export default ServiceWrapper;
