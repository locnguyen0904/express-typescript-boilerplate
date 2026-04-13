import argon2 from 'argon2';
import mongoose, { Model, Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongooseDelete from 'mongoose-delete';
import mongoosePaginate from 'mongoose-paginate-v2';

import { BaseDocument } from '@/core';
import { applyPlugin } from '@/helpers';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export const userRoles = [UserRole.Admin, UserRole.User] as const;

export interface IUser extends BaseDocument {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  isPasswordMatch(password: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  isEmailTaken(
    email: string,
    excludeUserId?: mongoose.Types.ObjectId
  ): Promise<boolean>;
}

const UserSchema = new Schema<IUser, IUserModel>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: userRoles,
      default: UserRole.User,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }
  next();
});

UserSchema.methods.isPasswordMatch = async function (
  password: string
): Promise<boolean> {
  if (!this.password) return false;
  return argon2.verify(this.password, password);
};

UserSchema.statics.isEmailTaken = async function (
  email: string,
  excludeUserId?: mongoose.Types.ObjectId
): Promise<boolean> {
  const user = await this.findOne({
    email,
    _id: { $ne: excludeUserId },
  }).lean();
  return !!user;
};
applyPlugin(UserSchema, mongooseDelete, {
  deletedAt: true,
  overrideMethods: 'all',
});
applyPlugin(UserSchema, mongooseAggregatePaginate);
applyPlugin(UserSchema, mongoosePaginate);

// Add index for createdAt (used for default sorting)
UserSchema.index({ createdAt: -1 });

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
