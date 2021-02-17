import { Service } from 'typedi';
import FullCrudTEService from './FullService';
import { CreatedResponse } from '../types';

@Service()
class AdminFullService<T, E, K> extends FullCrudTEService<T, E> {
  constructor(urlSlug: string) {
    super(urlSlug);
  }

  async createAsAdmin(contactData: K): Promise<CreatedResponse> {
    const result = await this.create(contactData as any);
    return result;
  }
}

export default AdminFullService;
