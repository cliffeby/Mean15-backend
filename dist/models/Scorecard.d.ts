import mongoose, { Document, Model } from 'mongoose';
export interface IScorecard extends Document {
    groupName?: string;
    name?: string;
    rating?: number;
    slope?: number;
    parInputString?: string;
    pars?: number[];
    par?: number;
    hCapInputString?: string;
    hCaps?: number[];
    yardsInputString?: string;
    yards?: number[];
    scorecardsId?: mongoose.Types.ObjectId[];
    scorecardId?: mongoose.Types.ObjectId;
    user?: string;
}
export declare const Scorecard: Model<IScorecard>;
