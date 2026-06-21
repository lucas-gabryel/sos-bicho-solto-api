import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';

interface CorpoErro {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, error } = this.extrair(exception, status);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const corpo: CorpoErro = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(corpo);
  }

  private extrair(
    exception: unknown,
    status: number,
  ): { message: string | string[]; error: string } {
    const fraseHttp = STATUS_CODES[status] ?? 'Error';

    if (exception instanceof HttpException) {
      const resposta = exception.getResponse();

      if (typeof resposta === 'string') {
        return { message: resposta, error: fraseHttp };
      }

      const obj = resposta as { message?: string | string[]; error?: string };
      return {
        message: obj.message ?? exception.message,
        error: obj.error ?? fraseHttp,
      };
    }

    return {
      message: 'Erro interno do servidor',
      error: fraseHttp,
    };
  }
}
