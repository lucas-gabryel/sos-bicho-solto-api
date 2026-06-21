import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url } = request;
    const inicio = Date.now();

    return next.handle().pipe(
      tap(() => {
        const status = ctx.getResponse<Response>().statusCode;
        this.logger.log(
          `${method} ${url} ${status} - ${Date.now() - inicio}ms`,
        );
      }),
    );
  }
}
