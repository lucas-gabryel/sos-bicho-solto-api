import { Perfil } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  perfil: Perfil;
}
