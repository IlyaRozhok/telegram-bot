import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), './db.json');

export const getDebts = () => {
  try {
    return JSON.parse(readFileSync(dbPath, 'utf-8'));
  } catch (e) {
    return [];
  }
};

export const addDebt = (newDebt) => {
  const debts = getDebts();
  debts.push(newDebt);
  writeFileSync(dbPath, JSON.stringify(debts, null, 2));
  return debts;
};
