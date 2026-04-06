import mongoose, { Schema } from 'mongoose';

const categorySchema = new Schema({userId     : {type    : Schema.Types.ObjectId,
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

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
