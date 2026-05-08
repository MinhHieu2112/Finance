import userModel from '../../../models/Users';

class forgotPasswordRepository {
    async findByPhone(phone: string) {
        return userModel.findOne({ phone }).select('+resetPasswordToken +resetPasswordExpires');
    }

    async updateResetToken(userId: string, token: string, expires: Date) {
        return userModel.findByIdAndUpdate(userId, {
            resetPasswordToken: token,
            resetPasswordExpires: expires
        });
    }

    async updatePassword(userId: string, passwordHash: string) {
        return userModel.findByIdAndUpdate(userId, {
            password: passwordHash,
            $unset: {
                resetPasswordToken: 1,
                resetPasswordExpires: 1
            }
        });
    }
}

export default new forgotPasswordRepository();
