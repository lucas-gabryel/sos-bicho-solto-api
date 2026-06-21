import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';

export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
