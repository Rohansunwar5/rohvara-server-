import config from '../config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { encodedJWTCacheManager } from './cache/entities';
import { encode, encryptionKey } from './crypto.service';
import { SuperUserRepository } from "../repository/superUser.repository";

import { InternalServerError } from "../errors/internal-server.error";
import { NotFoundError } from "../errors/not-found.error";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { BadRequestError } from '../errors/bad-request.error';

class AuthService {
  constructor(private readonly _superUserRepository:SuperUserRepository ) {}
  
  async login(params: { username: string; password: string }) {
    const { username, password } = params;
    
    const superUser = await this._superUserRepository.getSuperUserByUsername(username);
    if (!superUser) throw new NotFoundError('Super user not found');
    if (!superUser.password) throw new BadRequestError('Account setup incomplete');

    // Check if password is valid
    const success = await this.verifyHashPassword(password, superUser.password);
    if (!success) throw new UnauthorizedError('Invalid username or password');

    // Update last login
    await this._superUserRepository.updateLastLogin(superUser._id);

    // Generate JWT token
    const accessToken = await this.generateJWTToken(superUser._id);
    if (!accessToken) throw new InternalServerError('Failed to generate accessToken');

    return { accessToken };
  }

  async signup(params: {
    username: string;
    password: string;
    email?: string;
    lounge_name: string;
  }) {
    const { username, password, email, lounge_name } = params;
    
    const existingUser = await this._superUserRepository.getSuperUserByUsername(username);
    if (existingUser) throw new BadRequestError('Username already exists');

    // Check email if provided
    if (email) {
      const existingEmail = await this._superUserRepository.getSuperUserByEmail(email);
      if (existingEmail) throw new BadRequestError('Email already exists');
    }

    // Get hashed password
    const hashedPassword = await this.hashPassword(password);

    // Create super user
    const superUser = await this._superUserRepository.createSuperUser({
      username,
      password: hashedPassword,
      email: email || null,
      lounge_name
    });

    if (!superUser) throw new InternalServerError('Failed to create super user');

    // Generate JWT token
    const accessToken = await this.generateJWTToken(superUser._id);
    if (!accessToken) throw new InternalServerError('Failed to generate accessToken');

    return { 
      accessToken,
      user: {
        id: superUser._id,
        username: superUser.username,
        lounge_name: superUser.lounge_name
      }
    };
  }

  async profile(userId: string) {
    const superUser = await this._superUserRepository.getSuperUserById(userId);
    if (!superUser) throw new NotFoundError('Super user not found');

    return {
      user: {
        id: superUser._id,
        username: superUser.username,
        email: superUser.email,
        lounge_name: superUser.lounge_name,
        settings: superUser.settings,
        last_login: superUser.last_login,
        createdAt: superUser.createdAt
      }
    };
  }

  async verifyHashPassword(plainTextPassword: string, hashedPassword: string) {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async hashPassword(plainTextPassword: string) {
    return await bcrypt.hash(plainTextPassword, 10);
  }

  async generateJWTToken(userId: string) {
    const token = jwt.sign(
      {
        userId: userId.toString(), // Using userId instead of _id for consistency
      },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Cache the token (following your pattern)
    const key = await encryptionKey(config.JWT_CACHE_ENCRYPTION_KEY);
    const encryptedData = await encode(token, key);
    await encodedJWTCacheManager.set({ userId }, encryptedData);

    return token;
  }
}

export default new AuthService(new SuperUserRepository());