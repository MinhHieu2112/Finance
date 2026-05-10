import authService from '../../modules/Users/login/Service';
import authRepository from '../../modules/Users/login/Repository';
import AppError from '../../utils/appError';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../modules/Users/login/Repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    const mockLoginData = {
        email: 'test@example.com',
        password: 'password123'
    };

    beforeEach(() => {
        process.env.JWT_SECRET = 'test_secret';
        jest.clearAllMocks();
    });

    test('should throw error if email is invalid', async () => {
        await expect(authService.login({ email: 'invalid', password: '123' }))
            .rejects.toThrow('định dạng email hợp lệ');
    });

    test('should throw error if user not found', async () => {
        (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
        await expect(authService.login(mockLoginData))
            .rejects.toThrow('Tài khoản không tồn tại');
    });

    test('should throw error if password incorrect', async () => {
        (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ 
            _id: 'u123', 
            email: 'test@example.com', 
            password: 'hashed_password' 
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(authService.login(mockLoginData))
            .rejects.toThrow('Mật khẩu không chính xác');
    });

    test('should return token if login successful', async () => {
        (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ 
            _id: 'u123', 
            username: 'tester',
            email: 'test@example.com', 
            password: 'hashed_password' 
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue('mock_token');

        const result = await authService.login(mockLoginData);
        expect(result.token).toBe('mock_token');
        expect(result.user.username).toBe('tester');
    });
});
