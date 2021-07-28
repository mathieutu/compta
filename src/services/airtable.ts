import Airtable, { Records, SelectOptions } from 'airtable';


type Type = 'École' | 'Développement'| 'Formation' | 'Cotisation' | 'Subvention'

type AirtableRecord = {
  'Date Paiement'?: string;
  'Date Facturation': string;
  Mission: string;
  Client: string;
  Total: number;
  Ref: string;
  Type: Type;
  Prix: string;
}

export type Transaction = {
  datePaiement: Date | undefined;
  dateFacturation: Date | undefined;
  mission: string;
  client: string;
  total: number;
  ref: string;
  type: Type;
  prix: string;
}

export const fetchTransactions = async (select: SelectOptions<AirtableRecord> = {}) => {
  let transactions: Transaction[] = [];
  const table = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

  await table('Transactions').select({ sort: [{ field: 'Date Paiement', direction: 'desc' }, { field: 'Date Facturation', direction: 'desc' }], ...select } as any).eachPage((records, fetchNextPage) => {
    transactions = [
      ...transactions,
      ...(records as unknown as Records<AirtableRecord>).map(({ fields }) => ({
        ref: fields['Ref'],
        datePaiement: fields['Date Paiement'] ? new Date(fields['Date Paiement']) : undefined,
        dateFacturation: fields['Date Facturation'] ? new Date(fields['Date Facturation']) : undefined,
        mission: fields['Mission'],
        client: fields['Client'],
        total: fields['Total'],
        type: fields['Type'],
        prix: fields['Prix'],
      }))
    ];

    fetchNextPage();
  })

  return [
    ...transactions.filter(({ dateFacturation }) => !dateFacturation),
    ...transactions.filter(({ datePaiement, dateFacturation }) => dateFacturation && !datePaiement),
    ...transactions.filter(({ datePaiement, dateFacturation }) => dateFacturation && datePaiement),

  ];
};

