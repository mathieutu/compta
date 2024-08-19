import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from "next-auth/providers/credentials"

export const isAuthEnabled = !['true', 1].includes(process.env.AUTH_DISABLED || '')

export default NextAuth({
  providers: [
    isAuthEnabled
    ? GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!
    })
    : CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        // username: { label: "Username", type: "text" },
        // password: {  label: "Password", type: "password" }
       },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        return {
          id: '0',
          name: 'J Smith',
          email: 'jsmith@example.com',
          image: 'https://i.pravatar.cc/150?u=jsmith@example.com',
        };
      }
    }),
  ],
  callbacks: {
    signIn({user}) {
      if (!isAuthEnabled) return true

      return process.env.GITHUB_ALLOWED_IDS?.split(',').includes(user.id) || false
    }
  }
})