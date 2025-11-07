import type { Request, Response, NextFunction } from 'express';
export declare function createScorecard(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllScorecards(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getScorecard(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateScorecard(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteScorecard(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
