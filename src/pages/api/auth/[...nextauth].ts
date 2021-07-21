import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    }),
  ],
  callbacks: {
    signIn(user, account) {
      return process.env.GITHUB_ALLOWED_IDS?.split(',').includes(String(account.id)) || false
    }
  }
})