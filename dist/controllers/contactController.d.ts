import type { Request, Response, NextFunction } from 'express';
export declare function submitContact(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllContacts(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getContact(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteContact(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
