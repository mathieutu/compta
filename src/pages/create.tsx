import { getSession } from "next-auth/react"
import { handle, json } from "next-runtime"
import Script from 'next/script'
export const getServerSideProps = handle({
  async get(ctx) {
    const session = await getSession(ctx)

    return json({
      session,
    })
  }
})

export default function Create() {
  return <iframe className="h-screen" src="https://airtable.com/embed/shrj0cSm8stQDoeRm?backgroundColor=yellow" width="100%" />
}