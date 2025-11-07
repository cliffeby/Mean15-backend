import type { Request, Response, NextFunction } from 'express';
export declare const getMembers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMember: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createMember: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateMember: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMember: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
