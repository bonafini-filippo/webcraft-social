import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      name?: string
      image?: string
      isAdmin: boolean
    }
  }

  interface User {
    username: string
    isAdmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string
    isAdmin: boolean
  }
} 