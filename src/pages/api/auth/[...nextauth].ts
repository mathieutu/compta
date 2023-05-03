import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!
    }),
  ],
  callbacks: {
    signIn({user}) {
      return process.env.GITHUB_ALLOWED_IDS?.split(',').includes(user.id) || false
    }
  }
})