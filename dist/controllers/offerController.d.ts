import type { Request, Response, NextFunction } from 'express';
export declare function createOffer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllOffers(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getOffer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateOffer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteOffer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
