import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../database/prisma.js';
import { JWT_SECRET, JWT_EXPIRATION_TIME } from '../../config/jwt.js';

type Role = 'BUYER' | 'SUPPLIER' | 'ADMIN';

interface RegisterUserDto {
  username: string;
  email: string;
  password: string;
  role: Role;
}

interface LoginUserDto {
  email: string;
  password: string;
}

interface AuthResponseDto {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: Role;
  };
}

export class UserService {
  async register(data: RegisterUserDto): Promise<AuthResponseDto> {
    const { username, email, password, role } = data;

    const userByEmail = await prisma.user.findUnique({ where: { email } });
    if (userByEmail) {
      throw new Error('User with this email already exists.');
    }

    const userByUsername = await prisma.user.findUnique({ where: { username } });
    if (userByUsername) {
      throw new Error('User with this username already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash: hashedPassword,
          role,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const fields = err.meta?.target ?? [];
        throw new Error(`Unique constraint failed on the fields: ${Array.isArray(fields) ? fields.join(', ') : fields}`);
      }
      throw err;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as Role,
      },
    };
  }

  async login(data: LoginUserDto): Promise<AuthResponseDto> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials.');
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as Role,
      },
    };
  }
}
