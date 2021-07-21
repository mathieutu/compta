import {
  AcademicCapIcon,
  LibraryIcon,
  OfficeBuildingIcon,
} from '@heroicons/react/outline'
import { GetServerSidePropsContext } from 'next'
import { getSummaryForYear } from '../services/transactions'
import { formatDateFr } from '../utils/dates'
import { formatAmount } from '../utils/number'
import { classNames } from '../utils/tw'
import { AsyncReturnType } from '../utils/types'
import { getSession } from "next-auth/client"

const TypeIcons = {
  'École': AcademicCapIcon,
  'Entreprise': OfficeBuildingIcon,
  'Cotisation': LibraryIcon,
  'Subvention': LibraryIcon,
}

const statusStyles = {
  draft: 'bg-gray-100 text-gray-800',
  waiting: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
}

type Props = AsyncReturnType<typeof getSummaryForYear> & { year: number }


export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const year = Number(ctx.params!.year)
  const session = await getSession(ctx)

  return {
    props: {
      session,
      ...(session ? await getSummaryForYear(year): {}),
      year,
    },
  }
}

const Card = ({ icon, title, amount, amountSecond }: { icon: string, title: string, amount: number, amountSecond?: number }) => {
  return <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-5xl" aria-hidden="true" >{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate" title={title}>{title}</dt>
            <dd>
              <div className="text-xl font-medium text-gray-900">
                {formatAmount(amount)}
                {amountSecond !== undefined ? (
                  <div className="text-xs font-light text-gray-500">{formatAmount(amountSecond)}</div>
                ) : null}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
}
export default function Index({ transactions, chiffresAffaires, nets, year, quartersDetails }: Props) {

  return (
    <div className="">
      <div className="mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Année {year}</h2>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon="💰" title="CA projeté" amount={chiffresAffaires.projete} />
          <Card icon="💵" title="CA réel" amount={chiffresAffaires.realise} />
          <Card icon="🤑" title="Net projeté" amount={nets.projete} />
          <Card icon="🏦" title="Net réel" amount={nets.realise} />
        </div>
      </div>
      <div className="mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Trimestres</h2>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(quartersDetails).map(([title, { amountToDeclare, plannedCotisation }]) => (
            <Card key={title} icon="💸" title={title} amount={amountToDeclare} amountSecond={plannedCotisation} />
          ))}
        </div>
      </div>

      <h2 className="max-w-6xl mx-auto mt-8 px-4 text-lg leading-6 font-medium text-gray-900 sm:px-6 lg:px-8">
        Transactions
      </h2>

      {/* Activity list (smallest breakpoint only) */}
      <div className="shadow sm:hidden ">
        <ul className="mt-2 divide-y divide-gray-200 overflow-hidden shadow sm:hidden">
          {transactions.map((transaction) => {
            const Icon = TypeIcons[transaction.type]

            return (
              <li key={transaction.ref}>
                <div className="block px-4 py-4 bg-white hover:bg-gray-50">
                  <span className="flex items-center space-x-4">
                    <span className="flex-1 flex space-x-2 truncate">
                      <Icon className={classNames("flex-shrink-0 h-5 w-5 opacity-70", transaction.total > 0 ? 'text-green-400' : 'text-red-400')} aria-hidden="true" />
                      <span className="flex flex-1 flex-col text-gray-500 text-sm truncate">
                        <span className="truncate">{transaction.client} - {transaction.mission} ({transaction.ref})</span>
                        <span>
                          <span className="text-gray-900 font-medium" title={transaction.prix}>{formatAmount(transaction.total)}</span>
                        </span>
                        <span className="text-right">
                          <span
                            className={classNames(
                              statusStyles[transaction.datePaiement ? 'done' : transaction.dateFacturation ? 'waiting' : 'draft'],
                              'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium'
                            )}
                          >
                            {
                              transaction.datePaiement
                                ? `Payé le ${formatDateFr(transaction.datePaiement)}`
                                : transaction.dateFacturation
                                  ? `${transaction.total > 0 ? 'Facturé' : 'Réglé'} le ${formatDateFr(transaction.dateFacturation)}`
                                  : 'À facturer'
                            }
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Activity table (small breakpoint and up) */}
      <div className="hidden sm:block">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col mt-2">
            <div className="align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="hidden px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:block">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => {
                    const Icon = TypeIcons[transaction.type]

                    return (
                      <tr key={transaction.ref} className="bg-white">
                        <td className="max-w-0 w-full px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex">
                            <div className="group inline-flex space-x-2 truncate text-sm">
                              <Icon className={classNames("flex-shrink-0 h-5 w-5 opacity-70", transaction.total > 0 ? 'text-green-400' : 'text-red-400')} aria-hidden="true" />

                              <p className="text-gray-500 truncate group-hover:text-gray-900">{transaction.client} - {transaction.mission} ({transaction.ref})</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-500">
                          <span className="text-gray-900 font-medium" title={transaction.prix}>
                            {formatAmount(transaction.total)}
                          </span>
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:block">
                          <span
                            className={classNames(
                              statusStyles[transaction.datePaiement ? 'done' : transaction.dateFacturation ? 'waiting' : 'draft'],
                              'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium'
                            )}
                          >
                            {transaction.datePaiement
                              ? `Payé le ${formatDateFr(transaction.datePaiement)}`
                              : transaction.dateFacturation
                                ? `${transaction.total > 0 ? 'Facturé' : 'Réglé'} le ${formatDateFr(transaction.dateFacturation)}`
                                : 'À facturer'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

