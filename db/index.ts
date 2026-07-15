export function getDb() {
  throw new Error(
    "D1 is disabled for LogiSight. Configure DATABASE_URL and use the Prisma/PostgreSQL adapter defined in prisma/schema.prisma.",
  );
}
