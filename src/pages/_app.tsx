import 'tailwindcss/tailwind.css'
import type { AppProps } from 'next/app'
import { useSession, signIn } from "next-auth/client"
import { App } from '../components/App'
import { Login } from '../components/Login'

export default function MyApp({ Component, pageProps }: AppProps) {

  if (pageProps.session?.user) {
    return (
      <App user={pageProps.session.user}>
        <Component {...pageProps} />
      </App>
    )
  }

  return <Login />
}
