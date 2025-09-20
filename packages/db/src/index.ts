import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Use Accelerate at runtime
    datasourceUrl: process.env.PRISMA_ACCELERATE_URL ?? process.env.DATABASE_URL,
  }).$extends(withAccelerate())
}

declare global {
  // avoid multiple instances in dev
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export default prisma
