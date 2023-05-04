import Airtable, { FieldSet, SelectOptions } from 'airtable';

export enum TransactionType {
  ecole = 'École',
  dev = 'Développement',
  formation = 'Formation',
  cotisation = 'Cotisation',
  subvention =  'Subvention',
}

export enum TransactionStatus {
  done = 'done',
  waiting = 'waiting',
  draft = 'draft',
}

type AirtableTransaction = {
  'Date Paiement'?: string;
  'Date Facturation': string;
  Mission: string;
  Client: string;
  Total: number;
  Ref: string;
  Type: TransactionType;
  Prix: string;
}

export type Transaction = {
  id: string;
  datePaiement: Date | undefined;
  dateFacturation: Date | undefined;
  mission: string;
  client: string;
  total: number;
  ref: string;
  type: TransactionType;
  prix: string;
  status: TransactionStatus;
  url: string;
}

export const AIRTABLE_URL = "https://airtable.com/tblDxymNWvm8pJQno/viwXqk9tuBBdQS0kP"

const parseTransaction = ({ id, fields }: { id: string, fields: AirtableTransaction }): Transaction => ({
  id,
  ref: fields['Ref'],
  datePaiement: fields['Date Paiement'] ? new Date(fields['Date Paiement']) : undefined,
  dateFacturation: fields['Date Facturation'] ? new Date(fields['Date Facturation']) : undefined,
  mission: fields['Mission'],
  client: fields['Client'],
  total: fields['Total'],
  type: fields['Type'],
  prix: fields['Prix'],
  status: fields['Date Paiement'] ? TransactionStatus.done : fields['Date Facturation'] ? TransactionStatus.waiting : TransactionStatus.draft,
  url: `${AIRTABLE_URL}/${id}`,
})

const table = <AirtableRecord extends FieldSet>(tableName:string) => new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!).table<AirtableRecord>(tableName);

const transactionsTable = () => table<AirtableTransaction>('Transactions');

export const fetchTransactions = async (select: SelectOptions<AirtableTransaction> = {}) => {
  const transactions: Record<TransactionStatus, Transaction[]> = {
    [TransactionStatus.draft]: [],
    [TransactionStatus.waiting]: [],
    [TransactionStatus.done]: [],
  };
  await transactionsTable().select({ sort: [{ field: 'Date Paiement', direction: 'desc' }, { field: 'Date Facturation', direction: 'desc' }], ...select } as any).eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      const transaction = parseTransaction(record);
      transactions[transaction.status].push(transaction);
    });

    fetchNextPage();
  })

  
  return [
    
    ...transactions[TransactionStatus.draft],
    ...transactions[TransactionStatus.waiting],
    ...transactions[TransactionStatus.done],

  ];
};

const updateTransaction = (transactionId: string, fields: Partial<AirtableTransaction>) => transactionsTable().update(transactionId, fields).then(parseTransaction);

export const updateTransactionDate = async (transactionId: string, currentStatus: TransactionStatus, date: string) => {
  if (currentStatus === TransactionStatus.draft) {
    return updateTransaction(transactionId, { 'Date Facturation': date });
  }
  
  if (currentStatus === TransactionStatus.waiting) {
    return updateTransaction(transactionId, { 'Date Paiement': date });
  }

  throw new Error('Transaction is already paid, cannot update any date');
}

