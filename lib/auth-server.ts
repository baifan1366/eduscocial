import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Get the current authenticated session
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      username: true,
      university: true,
      studyField: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  
  return user;
}

/**
 * Check if the current user is authenticated
 * If not, redirect to the login page
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return session;
}

/**
 * Check if the current user has the required role
 * If not, redirect to the unauthorized page
 */
export async function requireRole(roles: string | string[]) {
  const session = await requireAuth();
  const userRole = session.user.role;
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(userRole)) {
    redirect("/unauthorized");
  }
  
  return session;
} 