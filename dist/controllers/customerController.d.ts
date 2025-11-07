import type { Request, Response, NextFunction } from 'express';
export declare function createCustomer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllCustomers(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getCustomer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCustomer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
