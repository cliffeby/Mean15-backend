import mongoose, { Document, Model } from 'mongoose';
export interface IMember extends Document {
    firstName: string;
    lastName: string;
    usgaIndex?: number;
    lastDatePlayed?: string;
    scorecardsId?: mongoose.Types.ObjectId[];
    email?: string;
    user?: string;
}
export declare const Member: Model<IMember>;
