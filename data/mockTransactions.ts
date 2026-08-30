import type { RewardTransaction } from '@/types';

export const initialTransactions: RewardTransaction[] = [
  {
    id: 'tx-operation-falafel',
    restaurantId: 'operation-falafel',
    restaurantName: 'Operation: Falafel',
    cuisine: 'Middle Eastern',
    amount: 8.5,
    date: '25 Aug 2026',
    type: 'earned',
  },
  {
    id: 'tx-brunch-cake',
    restaurantId: 'brunch-and-cake',
    restaurantName: 'Brunch & Cake',
    cuisine: 'Cafe',
    amount: 6,
    date: '19 Aug 2026',
    type: 'earned',
  },
  {
    id: 'tx-green-chilli-old',
    restaurantId: 'green-chilli',
    restaurantName: 'Green Chilli',
    cuisine: 'Indian',
    amount: 3.5,
    date: '11 Aug 2026',
    type: 'earned',
  },
  {
    id: 'tx-redeemed',
    restaurantId: 'reif-japanese-kushiyaki',
    restaurantName: 'Reif Japanese Kushiyaki',
    cuisine: 'Japanese',
    amount: -12,
    date: '02 Aug 2026',
    type: 'redeemed',
  },
];

export const demoBillTransaction: RewardTransaction = {
  id: 'tx-demo-green-chilli',
  restaurantId: 'green-chilli',
  restaurantName: 'Green Chilli',
  cuisine: 'Indian',
  amount: 10,
  date: '28 Aug 2026',
  type: 'earned',
};

