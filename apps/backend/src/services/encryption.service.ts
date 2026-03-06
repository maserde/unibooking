import { encrypt, decrypt } from '../utils/crypto';
import { merchantRepository } from '../repositories/merchant.repository';
import { AppError } from '../middleware/error.middleware';

export const encryptionService = {
  encryptApiKey(plainKey: string): string {
    return encrypt(plainKey);
  },

  decryptApiKey(encrypted: string): string {
    return decrypt(encrypted);
  },

  async getMerchantApiKey(merchantId: string): Promise<string> {
    const merchant = await merchantRepository.findById(merchantId);
    if (!merchant?.mayar_api_key_encrypted) {
      throw new AppError('Payment gateway not configured. Please set up your Mayar API key.', 422);
    }
    return decrypt(merchant.mayar_api_key_encrypted);
  },
};
