import type { Request, Response, NextFunction } from 'express';
export declare function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getUser(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUser(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteUser(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
