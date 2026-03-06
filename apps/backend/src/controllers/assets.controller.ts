import type { Request, Response } from 'express';
import { assetService } from '../services/asset.service';
import { assetRepository } from '../repositories/asset.repository';
import { assetUnitRepository } from '../repositories/assetUnit.repository';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';

export const assetsController = {
  async listAssets(req: Request, res: Response): Promise<void> {
    const assets = await assetService.listAssets(req.merchantId!);
    successResponse(res, assets);
  },

  async createAsset(req: Request, res: Response): Promise<void> {
    const asset = await assetService.createAsset(req.merchantId!, req.body);
    successResponse(res, asset, 'Asset created', 201);
  },

  async updateAsset(req: Request, res: Response): Promise<void> {
    const asset = await assetService.updateAsset(req.merchantId!, req.params.id, req.body);
    successResponse(res, asset);
  },

  async deleteAsset(req: Request, res: Response): Promise<void> {
    await assetService.deleteAsset(req.merchantId!, req.params.id);
    successResponse(res, null, 'Asset deleted');
  },

  async listUnits(req: Request, res: Response): Promise<void> {
    const units = await assetService.listUnits(req.merchantId!, req.params.id);
    successResponse(res, units);
  },

  async addUnit(req: Request, res: Response): Promise<void> {
    const unit = await assetService.addUnit(req.merchantId!, req.params.id, req.body.identifier);
    successResponse(res, unit, 'Unit added', 201);
  },

  async updateUnit(req: Request, res: Response): Promise<void> {
    const unit = await assetService.updateUnit(req.merchantId!, req.params.id, req.body);
    successResponse(res, unit);
  },

  async deleteUnit(req: Request, res: Response): Promise<void> {
    await assetService.deleteUnit(req.merchantId!, req.params.id);
    successResponse(res, null, 'Unit deleted');
  },

  async initialCatalogSetup(req: Request, res: Response): Promise<void> {
    const { asset: assetData, units } = req.body;
    const asset = await assetService.createAsset(req.merchantId!, assetData);
    const createdUnits = await Promise.all(
      units.map((u: { identifier: string }) =>
        assetService.addUnit(req.merchantId!, asset.id, u.identifier),
      ),
    );
    successResponse(res, { asset, units: createdUnits }, 'Catalog setup complete', 201);
  },
};
