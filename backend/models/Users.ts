import mongoose, { Schema } from 'mongoose';

// Schema lưu trữ thông tin người dùng.
const usersSchema = new Schema({username    : {type    : String,
                                               required: true,
                                               unique  : true,},
                                email       : {type    : String,
                                               required: true,
                                               unique  : true,
                                               lowercase: true,
                                               trim    : true,},
                                phone       : {type    : String,
                                               required: true,},
                                password    : {type    : String,
                                               required: true,
                                               minlength: 4,
                                               select  : false,},
                                resetPasswordToken: {type: String, select: false},
                                resetPasswordExpires: {type: Date, select: false}},
                                {timestamps : true,
                                 versionKey : false,
                                 collection : 'users'}
);

export default mongoose.model('User', usersSchema);
