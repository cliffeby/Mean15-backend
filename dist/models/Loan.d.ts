import { Schema, Document, Model } from 'mongoose';
export interface ILoan extends Document {
    customer: Schema.Types.ObjectId;
    amount: number;
    termMonths: number;
    interestRate: number;
    status: 'pending' | 'approved' | 'declined';
    createdBy: Schema.Types.ObjectId;
}
export declare const Loan: Model<ILoan>;
