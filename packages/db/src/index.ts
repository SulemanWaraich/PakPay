import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: process.env.PRISMA_ACCELERATE_URL ?? process.env.DATABASE_URL,
  }).$extends(withAccelerate())
}

// Plain client for $transaction usage (Accelerate doesn't support interactive transactions anyway)
const plainClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
  var prismaPlainGlobal: undefined | ReturnType<typeof plainClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
export const prismaPlain = globalThis.prismaPlainGlobal ?? plainClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
  globalThis.prismaPlainGlobal = prismaPlain
}

export default prisma