import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['anomaly', 'reminder', 'system', 'advice'],
        default: 'system',
    },
    isRead: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    versionKey: false,
    collection: 'notifications'
});

export default mongoose.model('Notification', notificationSchema);
