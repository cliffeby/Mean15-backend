import { Document, Model } from 'mongoose';
export interface IOffer extends Document {
    title: string;
    description: string;
    interestRate: number;
    validTill: Date;
}
export declare const Offer: Model<IOffer>;
