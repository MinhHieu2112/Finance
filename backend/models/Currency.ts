import mongoose, { Schema, Document } from 'mongoose';

export interface ICurrency extends Document {
  code      : string;   
  name      : string;   
  symbol    : string;   
  rateToVnd : number;   
  userId    : mongoose.Types.ObjectId; 
  createdAt : Date;
  updatedAt : Date;
}

const CurrencySchema: Schema = new Schema(
  {
    code: { 
      type     : String, 
      required : [true, 'Mã tiền tệ là bắt buộc'], 
      uppercase: true, 
      trim     : true 
    },
    name: { 
      type     : String, 
      required : [true, 'Tên tiền tệ là bắt buộc'], 
      trim     : true 
    },
    symbol: { 
      type     : String, 
      default  : '' 
    },
    rateToVnd: { 
      type     : Number, 
      required : [true, 'Tỷ giá quy đổi sang VND là bắt buộc'], 
      min      : [0, 'Tỷ giá không thể âm'] 
    },
    userId: { 
      type     : Schema.Types.ObjectId, 
      ref      : 'User', 
      required : true 
    },
  },
  { 
    timestamps: true 
  }
);
CurrencySchema.index({ userId: 1, code: 1 }, { unique: true });

export default mongoose.model<ICurrency>('Currency', CurrencySchema);
