import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  CommandLineIcon,
  PresentationChartBarIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'
import { getSummaryForYear } from '../services/transactions'
import { formatDateFr, formatDateIso } from '../utils/dates'
import { formatAmount } from '../utils/number'
import { classNames, Heroicon } from '../utils/tw'
import { AsyncReturnType } from '../utils/types'
import { getSession } from "next-auth/react"
import { Transaction, TransactionStatus, TransactionType, updateTransactionDate } from '../services/airtable'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { handle, json, redirect } from 'next-runtime';
import { Form, useFormSubmit } from 'next-runtime/form';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useRefresh } from '../utils/hooks'
import { isAuthEnabled } from './api/auth/[...nextauth]'

const typeIcons = {
  [TransactionType.ecole]: AcademicCapIcon,
  [TransactionType.dev]: CommandLineIcon,
  [TransactionType.formation]: PresentationChartBarIcon,
  [TransactionType.subvention]: BuildingLibraryIcon,
  [TransactionType.cotisation]: BuildingLibraryIcon,
} satisfies Record<TransactionType, Heroicon>

type Props = AsyncReturnType<typeof getSummaryForYear> & { year: number, searchQuery: string }

export const getServerSideProps = handle({
  async get(ctx) {
    const year = Number(ctx.params!.year)
    const session = await getSession(ctx)

    return json({
      isAuthEnabled,
      session,
      ...(session ? await getSummaryForYear(year) : {}),
      year,
    })
  },
  // @ts-expect-error We don't want to return anything here
  async put(ctx) {
    const { transactionId, date, status } = ctx.req.body as { transactionId: string, date: string, status: TransactionStatus }

    await updateTransactionDate(transactionId, status, date)

    return json({ success: true })
  }
})

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

const StatusBadge = ({ transaction }: { transaction: Transaction }) => {

  const statusBadgesProps = {
    [TransactionStatus.draft]: { className: 'bg-gray-100 text-gray-800', children: 'À facturer', onClick: () => { } },
    [TransactionStatus.waiting]: { className: 'bg-yellow-100 text-yellow-800', children: `${transaction.total > 0 ? 'Facturé' : 'Réglé'} le ${formatDateFr(transaction.dateFacturation)}`, onClick: () => { } },
    [TransactionStatus.done]: { className: 'bg-green-100 text-green-800', children: `${transaction.total > 0 ? 'Reçu' : 'Prélevé'}  le ${formatDateFr(transaction.datePaiement)}`, disabled: true },
  }

  const { className, ...props } = statusBadgesProps[transaction.status]
  const submitRef = useRef<HTMLButtonElement>(null)

  const refresh = useRefresh()
  const [date, setDate] = useState<Date>()

  return (
    <Form method="put" name="update-transaction-date" onSuccess={refresh}>
      <input type="hidden" name="transactionId" value={transaction.id} />
      <input type="hidden" name="date" value={formatDateIso(date)} />
      <input type="hidden" name="status" value={transaction.status} />
      <DatePicker
        disabled={'disabled' in props && props.disabled}
        selected={date}
        onChange={date => setDate(date!)}
        minDate={transaction.dateFacturation}
        maxDate={new Date()}
        customInput={
          <button type="button" className={classNames('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium', className)} {...props} />
        }
        shouldCloseOnSelect={false}
        onCalendarClose={() => {
          if (date) {
            submitRef.current?.click()
          }
        }}
      />
      <button ref={submitRef} type="submit" className="hidden" />
    </Form>
  )
}

export default function Index({ transactions, chiffresAffaires, nets, year, quartersDetails, searchQuery }: Props) {

  type QuarterTitle = keyof typeof quartersDetails

  const [selectedQuarter, selectQuarter] = useState<QuarterTitle | null>(null)

  const handleQuarterSelection = (quarterTitle: QuarterTitle) => selectedQuarter === quarterTitle ? selectQuarter(null) : selectQuarter(quarterTitle)

  const transactionsToShow: Transaction[] = selectedQuarter ? quartersDetails[selectedQuarter].transactions : transactions


  const filteredTransactions = transactionsToShow.filter(transaction => searchQuery.toLowerCase().split(' ').every(word =>
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
          {filteredTransactions
            .map(transaction => {
              const Icon = typeIcons[transaction.type]

              return (
                <li key={`mobile_${transaction.id}`}>
                  <div className="block px-4 py-4 bg-white hover:bg-gray-50">
                    <span className="flex items-center space-x-4">
                      <span className="flex-1 flex space-x-2 truncate">
                        <Icon className={classNames("shrink-0 h-5 w-5 opacity-70", transaction.total > 0 ? 'text-green-400' : 'text-red-400')} aria-hidden="true" />
                        <span className="flex flex-1 flex-col text-gray-500 text-sm truncate">
                          <span className="truncate">{transaction.client} - {transaction.mission} ({transaction.ref})</span>
                          <span>
                            <span className="text-gray-900 font-medium" title={transaction.prix}>{formatAmount(transaction.total)}</span>
                          </span>
                          <span className="text-right">
                            <StatusBadge transaction={transaction} />
                          </span>
                        </span>
                        <button><PencilSquareIcon /></button>
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
                  {filteredTransactions
                    .map((transaction) => {
                      const Icon = typeIcons[transaction.type]

                      return (
                        <tr key={transaction.id} className="bg-white">
                          <td className="max-w-0 w-full px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex">
                              <div className="group inline-flex space-x-2 truncate text-sm">
                                <Icon className={classNames("shrink-0 h-5 w-5 opacity-70", transaction.total > 0 ? 'text-green-400' : 'text-red-400')} aria-hidden="true" />

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
                            <StatusBadge transaction={transaction} />
                          </td>
                          <td className='pr-6'>
                            <a href={transaction.url} target="_blank" rel="noopener noreferer" className='block text-gray-400 hover:text-gray-500 focus:text-gray-500'>
                              <PencilSquareIcon className='h-5 w-5' />
                            </a>

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

