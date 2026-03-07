import { assetRepository } from '../repositories/asset.repository';
import { assetImageRepository } from '../repositories/assetImage.repository';
import { assetUnitRepository } from '../repositories/assetUnit.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { storageService } from './storage.service';
import { AppError } from '../middleware/error.middleware';
import type { Asset, AssetImage, AssetUnit } from '../types/models';
import type { AssetType, PriceUnit, AssetUnitStatus } from '../types/enums';
import { generateUuid } from '../utils/uuid';

export const assetService = {
  async listAssets(merchantId: string): Promise<Asset[]> {
    return assetRepository.findAll(merchantId);
  },

  async createAsset(
    merchantId: string,
    data: {
      type: AssetType;
      name: string;
      base_price: number;
      price_unit: PriceUnit;
      attributes?: Record<string, unknown> | null;
    },
  ): Promise<Asset> {
    return assetRepository.create(merchantId, data);
  },

  async updateAsset(
    merchantId: string,
    assetId: string,
    data: Partial<Pick<Asset, 'name' | 'base_price' | 'price_unit' | 'attributes'>>,
  ): Promise<Asset> {
    const asset = await assetRepository.findById(merchantId, assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    await assetRepository.update(merchantId, assetId, data);
    return (await assetRepository.findById(merchantId, assetId))!;
  },

  async deleteAsset(merchantId: string, assetId: string): Promise<void> {
    const asset = await assetRepository.findById(merchantId, assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    await assetRepository.delete(merchantId, assetId);
  },

  async listUnits(merchantId: string, assetId: string): Promise<AssetUnit[]> {
    const asset = await assetRepository.findById(merchantId, assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    return assetUnitRepository.findByAssetId(assetId);
  },

  async addUnit(merchantId: string, assetId: string, identifier: string): Promise<AssetUnit> {
    const asset = await assetRepository.findById(merchantId, assetId);
    if (!asset) throw new AppError('Asset not found', 404);
    return assetUnitRepository.create(assetId, identifier);
  },

  async updateUnit(
    merchantId: string,
    unitId: string,
    data: Partial<Pick<AssetUnit, 'identifier' | 'status'>>,
  ): Promise<AssetUnit> {
    const belongs = await assetUnitRepository.belongsToMerchant(unitId, merchantId);
    if (!belongs) throw new AppError('Unit not found', 404);

    // Warn if setting to MAINTENANCE and has future CONFIRMED bookings
    if (data.status === 'MAINTENANCE') {
      const future = await bookingRepository.findAvailableUnits(unitId, new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
      // We're doing inverse: check active bookings for this unit
    }

    await assetUnitRepository.update(unitId, data);
    return (await assetUnitRepository.findById(unitId))!;
  },

  async deleteUnit(merchantId: string, unitId: string): Promise<void> {
    const belongs = await assetUnitRepository.belongsToMerchant(unitId, merchantId);
    if (!belongs) throw new AppError('Unit not found', 404);
    await assetUnitRepository.delete(unitId);
  },

  async uploadImage(merchantId: string, assetId: string, buffer: Buffer): Promise<AssetImage> {
    const asset = await assetRepository.findById(merchantId, assetId);
    if (!asset) throw new AppError('Asset not found', 404);

    const count = await assetImageRepository.countByAssetId(assetId);
    if (count >= 3) throw new AppError('Maximum 3 images per asset', 422);

    const imageId = generateUuid();
    const { s3Key, url } = await storageService.uploadImage(assetId, imageId, buffer);
    return assetImageRepository.create(assetId, s3Key, url, count);
  },

  async deleteImage(merchantId: string, assetId: string, imageId: string): Promise<void> {
    const asset = await assetRepository.findById(merchantId, assetId);
    if (!asset) throw new AppError('Asset not found', 404);

    const image = await assetImageRepository.findById(imageId);
    if (!image || image.asset_id !== assetId) throw new AppError('Image not found', 404);

    await storageService.deleteFile(image.s3_key);
    await assetImageRepository.delete(imageId);
  },
};
