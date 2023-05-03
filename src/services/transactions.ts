import { isDateInTrimester as isDateInQuarter } from "../utils/dates";
import { fetchTransactions, Transaction, Type } from "./airtable";

const currentYear = new Date().getFullYear();
const START_YEAR = 2018

export const yearsToFetch = [...Array(currentYear + 1 - START_YEAR)].map((_, key) => String(START_YEAR + key)).reverse()

const isVersement = (transaction: Transaction) => ![Type.cotisation, Type.subvention].includes(transaction.type) && transaction.total > 0

const sumTransactionsTotal = (records: Transaction[]) => records.reduce((acc, { total }) => acc + total, 0);

const calcCotisation = (amountToDeclare: number) => Math.round(amountToDeclare * 21.2 / 100) + Math.round(amountToDeclare * 0.2 / 100)

export const getTransactionsOfQuarter = (transactions: Transaction[], trimester: number, year?: number) => {
  const quarterTransactions = transactions
    .filter(({ datePaiement }) => isDateInQuarter(datePaiement, trimester, year))

  const amountToDeclare = sumTransactionsTotal(quarterTransactions.filter(isVersement))
  const plannedCotisation = calcCotisation(amountToDeclare)

  return {
    transactions: quarterTransactions,
    amountToDeclare,
    plannedCotisation: plannedCotisation ? -plannedCotisation : 0,
  }
}


export const getSummaryForYear = async (year = currentYear) => {
  const transactions = (await fetchTransactions())
    .filter(({ datePaiement, dateFacturation }) => {
      if (!datePaiement) {
        if  (!dateFacturation) return year === currentYear

        return dateFacturation.getFullYear() === year
      }

      return datePaiement.getFullYear() === year;
    })

  const versements = transactions.filter(isVersement);

  const quartersDetails = {
    '1er trimestre': getTransactionsOfQuarter(versements, 1, year),
    '2ème trimestre': getTransactionsOfQuarter(versements, 2, year),
    '3ème trimestre': getTransactionsOfQuarter(versements, 3, year),
    '4ème trimestre': getTransactionsOfQuarter(versements, 4, year),
  }

  const chiffreAffairesProjete = sumTransactionsTotal(versements);

  return {
    transactions,
    quartersDetails,
    chiffresAffaires: {
      projete: chiffreAffairesProjete,
      realise: sumTransactionsTotal(versements.filter(({ datePaiement }) => datePaiement)),
    },
    nets: {
      projete: chiffreAffairesProjete - calcCotisation(chiffreAffairesProjete),
      realise: sumTransactionsTotal(transactions.filter(({ datePaiement }) => datePaiement)),
    }
  }
}
