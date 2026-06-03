import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { sendSuccess, sendError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const generateToken = (userId: string, businessId?: string, role?: string) => {
  return jwt.sign(
    { userId, businessId: businessId || '', role: role || 'cashier' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const mapUserResponse = async (user: any) => {
  let stores: any[] = [];
  if (user.businessId) {
    const business = await Business.findById(user.businessId);
    if (business) {
      stores = [
        {
          id: business._id.toString(),
          storeName: business.name,
          businessType: 'Retail & ERP', // Default or custom
          gstNumber: business.taxId || null,
          ownerId: user._id.toString(),
          createdAt: business.createdAt.toISOString(),
        },
      ];
    }
  }
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    stores,
  };
};

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 400, 'A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // First user is created as 'owner'
    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? 'owner' : 'cashier';

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    });

    await user.save();

    const token = generateToken(user._id.toString(), undefined, user.role);
    const mappedUser = await mapUserResponse(user);

    return sendSuccess(res, 201, 'User registered successfully', {
      token,
      user: mappedUser,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal server error during registration');
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const businessIdStr = user.businessId ? user.businessId.toString() : undefined;
    const token = generateToken(user._id.toString(), businessIdStr, user.role);
    const mappedUser = await mapUserResponse(user);

    return sendSuccess(res, 200, 'Logged in successfully', {
      token,
      user: mappedUser,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal server error during login');
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, 'Not authenticated');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const mappedUser = await mapUserResponse(user);
    return sendSuccess(res, 200, 'User profile retrieved successfully', {
      user: mappedUser,
    });
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal server error retrieving user profile');
  }
};
