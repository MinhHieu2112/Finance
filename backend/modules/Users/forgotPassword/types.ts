export interface forgotPasswordRequest {
    phone: string;
}

export interface resetPasswordRequest {
    phone: string;
    otp: string;
    newPassword: string;
}
