import { Document, Model } from 'mongoose';
export interface ICustomer extends Document {
    name: string;
    email: string;
    phone?: string;
    dob?: Date;
    ssnLast4?: string;
    address?: string;
}
export declare const Customer: Model<ICustomer>;
