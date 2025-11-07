import { Document, Model } from 'mongoose';
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    matchPassword(enteredPassword: string): Promise<boolean>;
}
export declare const User: Model<IUser>;
