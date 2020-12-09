import { Service } from 'typedi';
import AuthenticatedService from './AuthenticatedService';
import { TotalExpertId, GetManyResponse, CreatedResponse } from '../types';

@Service()
class TEService<T, E> extends AuthenticatedService {
  constructor(urlSlug: string) {
    super(urlSlug);
  }

  protected async getToJSON(url: string): Promise<any> {
    const response = await this.auth.withAuthFetch(url);
    const data = await response.json();
    return data;
  }

  async create(providedData: E): Promise<CreatedResponse> {
    const options = { method: 'POST', body: JSON.stringify(providedData) };
    const response = await this.auth.withAuthFetch(this.urlSlug, options);
    const data = await response.json();
    return data;
  }

  async get(id: TotalExpertId): Promise<T> {
    const result = await this.getToJSON(`${this.urlSlug}/${id}`);
    return result;
  }

  async getMany(pageNumber: number = 0, pageSize: number = 10): Promise<GetManyResponse<T>> {
    const url = `${this.urlSlug}?page[number]=${pageNumber}&page[size]=${pageSize}`;
    return this.getToJSON(url);
  }
}

export default TEService;
