// Mock PrismaClient implementation
export class PrismaClient {
  user: any;
  account: any;
  session: any;
  verificationToken: any;

  constructor(options?: any) {
    // Mock user model
    this.user = {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async (data: any) => data.data,
      update: async (data: any) => data.data,
      delete: async () => ({}),
      count: async () => 0,
    };

    // Mock account model
    this.account = {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async (data: any) => data.data,
      update: async (data: any) => data.data,
      delete: async () => ({}),
      count: async () => 0,
    };

    // Mock session model
    this.session = {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async (data: any) => data.data,
      update: async (data: any) => data.data,
      delete: async () => ({}),
      count: async () => 0,
    };

    // Mock verificationToken model
    this.verificationToken = {
      findUnique: async () => null,
      findFirst: async () => null,
      findMany: async () => [],
      create: async (data: any) => data.data,
      update: async (data: any) => data.data,
      delete: async () => ({}),
      count: async () => 0,
    };

    // Log options if provided
    if (options?.log) {
      console.log('Mock PrismaClient initialized with log options:', options.log);
    }
  }

  $connect() {
    return Promise.resolve();
  }

  $disconnect() {
    return Promise.resolve();
  }
} 