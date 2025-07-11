// Mock PrismaAdapter implementation
export function PrismaAdapter(prismaClient: any) {
  return {
    createUser: async (data: any) => ({ id: 'mock-id', ...data }),
    getUser: async (id: string) => null,
    getUserByEmail: async (email: string) => null,
    getUserByAccount: async ({ providerAccountId, provider }: any) => null,
    updateUser: async (data: any) => data,
    deleteUser: async (id: string) => ({ id }),
    linkAccount: async (data: any) => data,
    unlinkAccount: async ({ providerAccountId, provider }: any) => ({ providerAccountId, provider }),
    createSession: async (data: any) => data,
    getSessionAndUser: async (sessionToken: string) => null,
    updateSession: async (data: any) => data,
    deleteSession: async (sessionToken: string) => ({ sessionToken }),
    createVerificationToken: async (data: any) => data,
    useVerificationToken: async ({ identifier, token }: any) => null,
  };
} 