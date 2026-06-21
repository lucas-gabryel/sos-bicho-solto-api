import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '@prisma/client';
import { PERFIS_KEY } from '#src/common/decorators/perfis.decorator';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';

@Injectable()
export class PerfilGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfisExigidos = this.reflector.getAllAndOverride<Perfil[]>(PERFIS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!perfisExigidos || perfisExigidos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

    if (!user || !perfisExigidos.includes(user.perfil)) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }

    return true;
  }
}
