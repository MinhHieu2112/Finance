import mongoose, { Schema } from 'mongoose';

const categorySchema = new Schema({id         : {type    : String,
                                                 required: true,
                                                 unique  : true,
                                                 trim    : true,},
                                   userID     : {type    : String,
                                                 required: true,
                                                 ref     : 'User',
                                                 index   : true,},
                                   name       : {type    : String,
                                                 required: true,
                                                 trim    : true,},
                                   description: {type   : String,
                                                 default: '',
                                                 trim   : true,}},
                                {timestamps: true,
                                 versionKey: false,
                                 collection: 'categories'}
);

categorySchema.index({ userID: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
