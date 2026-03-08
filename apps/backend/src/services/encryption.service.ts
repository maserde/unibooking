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
      throw new AppError('Gateway pembayaran belum dikonfigurasi. Silakan atur API key Mayar Anda.', 422);
    }
    return decrypt(merchant.mayar_api_key_encrypted);
  },
};
