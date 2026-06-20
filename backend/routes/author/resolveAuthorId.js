import { prisma } from "../../prisma/client.js";

/**
 * Resuelve de qué autor son los datos que se piden.
 *
 * - Un autor normal: siempre ve sus propios datos (su id de sesión).
 * - Un admin/superadmin: puede pasar ?authorId=NN para ver los datos de ESE autor
 *   (modo "ver como autor", de solo lectura). Si no lo pasa, ve los suyos.
 *
 * Devuelve el userId a usar, o null si no hay sesión válida.
 */
export async function resolveAuthorId(req) {
  if (!req.session.user_id) {
    return null;
  }

  const requestedAuthorId = req.query.authorId
    ? parseInt(req.query.authorId)
    : null;

  // Sin override solicitado: el usuario ve sus propios datos.
  if (!requestedAuthorId || requestedAuthorId === req.session.user_id) {
    return req.session.user_id;
  }

  // Hay override: solo se permite si el solicitante es admin o superadmin.
  const prismaClient = req.prisma || prisma;
  const requester = await prismaClient.user.findUnique({
    where: { id: req.session.user_id },
    select: { role: true },
  });

  if (requester && (requester.role === "admin" || requester.role === "superadmin")) {
    return requestedAuthorId;
  }

  // Un autor intentando ver los datos de otro autor: se ignora el override.
  return req.session.user_id;
}
