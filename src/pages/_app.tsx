import 'tailwindcss/tailwind.css'
import type { AppProps } from 'next/app'
import { App } from '../components/App'
import { Login } from '../components/Login'
import { useState } from 'react'

export default function MyApp({ Component, pageProps }: AppProps) {

  const [searchQuery, setSearchQuery] = useState('')

  if (!pageProps.session?.user) {
    return <Login />
  }


  return (
    <App user={pageProps.session.user} onSearch={setSearchQuery}>
      <Component {...pageProps} searchQuery={searchQuery} />
    </App>
  )

}
