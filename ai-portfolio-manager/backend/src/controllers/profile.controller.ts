import { Request, Response } from 'express';
import * as ProfileService from '@/services/profile.service';
import { financialProfileSchema } from '@/validators/profile.validator';
import { successResponse } from '@/utils/ApiResponse';
import { NotFoundError } from '@/utils/AppError';

/**
 * POST /api/financial-profile
 * Create financial profile for the authenticated user.
 */
export async function createProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  // Run validation
  const validatedData = financialProfileSchema.parse(req.body);

  // Call business logic
  const profile = await ProfileService.createFinancialProfile(userId, validatedData);

  res.status(201).json(
    successResponse('Financial profile created successfully', { profile })
  );
}

/**
 * GET /api/financial-profile/me
 * Retrieves the profile of the logged-in user.
 */
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  const profile = await ProfileService.getProfileByUserId(userId);

  if (!profile) {
    throw new NotFoundError('Financial profile');
  }

  res.status(200).json(
    successResponse('Financial profile retrieved successfully', { profile })
  );
}

/**
 * PUT /api/financial-profile/me
 * Updates the logged-in user's financial profile and recalculates dynamic fields.
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  // Run validation
  const validatedData = financialProfileSchema.parse(req.body);

  // Update in DB
  const updatedProfile = await ProfileService.updateFinancialProfile(userId, validatedData);

  res.status(200).json(
    successResponse('Financial profile updated and recalculated successfully', {
      profile: updatedProfile,
    })
  );
}
