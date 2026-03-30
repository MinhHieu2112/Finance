import mongoose, { Schema } from 'mongoose';

const usersSchema = new Schema({userID      : {type    : String,
                                               required: true,
                                               unique  : true,},
                                username    : {type    : String,
                                               required: true,
                                               unique  : true,},
                                email       : {type    : String,
                                               required: true,
                                               unique  : true,
                                               lowercase: true,
                                               trim    : true,},
                                password    : {type    : String,
                                               required: true,
                                               minlength: 4,
                                               select  : false,}},
                                {timestamps : true,
                                 versionKey : false,
                                 collection : 'users'}
);

export default mongoose.model('User', usersSchema);
