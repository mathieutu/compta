import { yearsToFetch } from '../services/transactions'

export function getStaticPaths() {

  return {
    paths: yearsToFetch.map(year => ({ params: { year } })),
    fallback: false,
  }
}

export { getStaticProps, default } from './index'