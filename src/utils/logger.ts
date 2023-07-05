import bunyan from 'bunyan';
import { NextFunction, Request, Response } from 'express';

export const logger = bunyan.createLogger({ name: 'kisetsu' });

export function logger2(_req: Request, _res: Response, next: NextFunction) {
  console.log('test');
  next();
}
