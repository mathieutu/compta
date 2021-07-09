import { isDateInTrimester } from "../utils/dates";
import { fetchTransactions, Transaction } from "./airtable";

const currentYear = new Date().getFullYear();
const START_YEAR = 2018

export const yearsToFetch = [...Array(currentYear + 1 - START_YEAR)].map((_, key) => String(START_YEAR + key)).reverse()

const sumTransactionsTotal = (records: Transaction[]) => records.reduce((acc, { total }) => acc + total, 0);
const calcCotisation = (amountToDeclare: number) => Math.round(amountToDeclare * 22.2 / 100)

export const getTransactionsOfQuarter = (transactions: Transaction[], trimester: number, year?: number) => {
  const quarterTransactions = transactions.filter(({ datePaiement }) => isDateInTrimester(datePaiement, trimester, year))
  const amountToDeclare = sumTransactionsTotal(quarterTransactions)

  return {
    transactions: quarterTransactions,
    amountToDeclare,
    plannedCotisation: -calcCotisation(amountToDeclare),
  }
}

export const getSummaryForYear = async (year = currentYear) => {
  const transactions = (await fetchTransactions()).filter(({ datePaiement, dateFacturation }) => (!datePaiement && dateFacturation.getFullYear() === year) || datePaiement?.getFullYear() === year)

  const versements = transactions.filter(({ total }) => total > 0);

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
      realise: sumTransactionsTotal(transactions.filter(({ total, datePaiement }) => total > 0 && datePaiement)),
    },
    nets: {
      projete: chiffreAffairesProjete - calcCotisation(chiffreAffairesProjete),
      realise: sumTransactionsTotal(transactions.filter(({ datePaiement }) => datePaiement)),
    }
  }
}