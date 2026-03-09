import mongoose, { Schema } from 'mongoose';

const usersSchema = new Schema({username    : {type    : String,
                                               required: true,
                                               unique  : true,},
                                email       : {type    : String,
                                               required: true,
                                               unique  : true,}},
                                {timestamps : true,
                                 versionKey : false,
                                 collection : 'users'}
);

export default mongoose.model('User', usersSchema);
