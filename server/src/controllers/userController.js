import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { validateAddress } from '../utils/validators.js';
import { MAX_SAVED_ADDRESSES } from '../config/constants.js';

/** GET /users/addresses */
export const listAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.addresses });
});

/** POST /users/addresses */
export const addAddress = asyncHandler(async (req, res) => {
  if (req.user.addresses.length >= MAX_SAVED_ADDRESSES) {
    throw ApiError.badRequest(`You can save up to ${MAX_SAVED_ADDRESSES} addresses.`);
  }
  req.user.addresses.push(validateAddress(req.body));
  await req.user.save();
  res.status(201).json({ success: true, message: 'Address saved.', data: req.user.addresses });
});

/** DELETE /users/addresses/:addressId */
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found.');
  address.deleteOne();
  await req.user.save();
  res.json({ success: true, message: 'Address removed.', data: req.user.addresses });
});
