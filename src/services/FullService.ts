import { Service } from 'typedi';
import ServiceWrapper from './PartialService';
import { TotalExpertId, UpdateResponse } from '../types';

// as of v1 in 12/2020 - not all entities support all the CRUD actions through the API.
// If they do - the service can extend this class to get these operations for free,
// if not they should extend base class of ServiceWrapper

@Service()
class FullCrudTEService<T, E> extends ServiceWrapper<T, E> {
  constructor(urlSlug: string) {
    super(urlSlug);
  }

  async update(id: TotalExpertId, updateData: E): Promise<UpdateResponse> {
    const options = { method: 'PATCH', body: JSON.stringify(updateData) };
    const response = await this.auth.withAuthFetch(`${this.urlSlug}/${id}`, options);
    const data: UpdateResponse = await response.json();
    return data;
  }

  async delete(id: TotalExpertId): Promise<void> {
    await this.auth.withAuthFetch(`${this.urlSlug}/${id}`, { method: 'DELETE' });
  }
}

export default FullCrudTEService;
