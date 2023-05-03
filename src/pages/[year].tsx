import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  CommandLineIcon,
  PresentationChartBarIcon,
} from '@heroicons/react/24/outline'
import type { GetServerSideProps } from 'next'
import { getSummaryForYear } from '../services/transactions'
import { formatDateFr } from '../utils/dates'
import { formatAmount } from '../utils/number'
import { classNames, Heroicon } from '../utils/tw'
import { AsyncReturnType } from '../utils/types'
import { getSession } from "next-auth/react"
import { Transaction, Type } from '../services/airtable'
import { useState } from 'react'

const typeIcons = {
  [Type.ecole]: AcademicCapIcon,
  [Type.dev]: CommandLineIcon,
  [Type.formation]: PresentationChartBarIcon,
  [Type.subvention]: BuildingLibraryIcon,
  [Type.cotisation]: BuildingLibraryIcon,
} satisfies Record<Type, Heroicon>

const statusStyles = {
  draft: 'bg-gray-100 text-gray-800',
  waiting: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
}

type Props = AsyncReturnType<typeof getSummaryForYear> & { year: number, searchQuery: string }

export const getServerSideProps = (async (ctx) => {
  const year = Number(ctx.params!.year)
  const session = await getSession(ctx)

  return {
    props: {
      session,
      ...(session ? await getSummaryForYear(year) : {}),
      year,
    },
  }
}) satisfies GetServerSideProps

const Card = ({ icon, title, amount, amountSecond, className }: { icon: string, title: string, amount: number, amountSecond?: number, className?: string }) => {
  return <div className={classNames("bg-white overflow-hidden shadow rounded-lg", className)}>
    <div className="p-5">
      <div className="flex items-center">
        <div className="shrink-0">
          <span className="text-5xl" aria-hidden="true" >{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate" title={title}>{title}</dt>
            <dd>
              <div className="text-xl font-medium text-gray-900">
                {formatAmount(amount)}
                {amountSecond !== undefined ? (
                  <div className="text-xs font-light text-gray-500">{amountSecond ? formatAmount(amountSecond) : <>&nbsp;</>}</div>
                ) : null}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
}

export default function Index({ transactions, chiffresAffaires, nets, year, quartersDetails, searchQuery }: Props) {

  type QuarterTitle = keyof typeof quartersDetails

  const [selectedQuarter, selectQuarter] = useState<QuarterTitle | null>(null)

  const handleQuarterSelection = (quarterTitle: QuarterTitle) => selectedQuarter === quarterTitle ? selectQuarter(null) : selectQuarter(quarterTitle)

  const transactionsToShow: Transaction[] = selectedQuarter ? quartersDetails[selectedQuarter].transactions : transactions

  const formattedTransactions = transactionsToShow
    .map(transaction => {
      const status = transaction.datePaiement ? 'done' : transaction.dateFacturation ? 'waiting' : 'draft'
      const statusLabel = transaction.datePaiement
        ? `Versé le ${formatDateFr(transaction.datePaiement)}`
        : transaction.dateFacturation
          ? `${transaction.total > 0 ? 'Facturé' : 'Réglé'} le ${formatDateFr(transaction.dateFacturation)}`
          : 'À facturer'

      const title = `${transaction.client} - ${transaction.mission} (${transaction.ref})`

      return {
        title,
        statusLabel,
        status: status as typeof status,
        total: transaction.total,
        prix: transaction.prix,
        type: transaction.type,
        ref: transaction.ref,
      }
    })
    .filter(transaction => searchQuery.toLowerCase().split(' ').every(word =>
      Object.values(transaction).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(word)
    ))


  return (
    <div className="">
      {!searchQuery && <>
        <div className="mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Année {year}</h2>
          <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card icon="💰" title="CA projeté" amount={chiffresAffaires.projete} />
            <Card icon="💵" title="CA réel" amount={chiffresAffaires.realise} />
            <Card icon="🤑" title="Net projeté" amount={nets.projete} />
            <Card icon="🏦" title="Net réel" amount={nets.realise} />
          </div>
        </div>
        {/* Quarters list */}
        <div className="mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Trimestres</h2>
          <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(quartersDetails).map(([title, { amountToDeclare, plannedCotisation }]) => (
              <button className="text-left" key={title} onClick={() => handleQuarterSelection(title as QuarterTitle)}>
                <Card
                  icon="💸"
                  title={title}
                  amount={amountToDeclare}
                  amountSecond={plannedCotisation}
                  className={classNames('border-2', selectedQuarter === title ? 'border-cyan-500' : 'border-transparent hover:border-gray-400')}
                />
              </button>
            ))}
          </div>
        </div>
        {/* /Quarters list */}
      </>
      }
      <h2 className="max-w-6xl mx-auto mt-8 px-4 text-lg leading-6 font-medium text-gray-900 sm:px-6 lg:px-8">
        Transactions
      </h2>

      {/* Activity list (smallest breakpoint only) */}
      <div className="shadow sm:hidden ">
        <ul className="mt-2 divide-y divide-gray-200 overflow-hidden shadow sm:hidden">
          {formattedTransactions
            .map(transaction => {
              const Icon = typeIcons[transaction.type]

              return (
                <li key={transaction.ref}>
                  <div className="block px-4 py-4 bg-white hover:bg-gray-50">
                    <span className="flex items-center space-x-4">
                      <span className="flex-1 flex space-x-2 truncate">
                        <Icon className={classNames("shrink-0 h-5 w-5 opacity-70", transaction.total > 0 ? 'text-green-400' : 'text-red-400')} aria-hidden="true" />
                        <span className="flex flex-1 flex-col text-gray-500 text-sm truncate">
                          <span className="truncate">{transaction.title})</span>
                          <span>
                            <span className="text-gray-900 font-medium" title={transaction.prix}>{formatAmount(transaction.total)}</span>
                          </span>
                          <span className="text-right">
                            <span
                              className={classNames(
                                statusStyles[transaction.status],
                                'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium'
                              )}
                            >
                              {transaction.statusLabel}
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {formattedTransactions
                    .map((transaction) => {
                      const Icon = typeIcons[transaction.type]

                      return (
                        <tr key={transaction.ref} className="bg-white">
                          <td className="max-w-0 w-full px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex">
                              <div className="group inline-flex space-x-2 truncate text-sm">
                                <Icon className={classNames("shrink-0 h-5 w-5 opacity-70", transaction.total > 0 ? 'text-green-400' : 'text-red-400')} aria-hidden="true" />

                                <p className="text-gray-500 truncate group-hover:text-gray-900">{transaction.title}</p>
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
                                statusStyles[transaction.status],
                                'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium'
                              )}
                            >
                              {transaction.statusLabel}
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

