import type { Offer } from '@/types';

export const offers: Offer[] = [
  {
    id: 'offer-green-chilli',
    restaurantId: 'green-chilli',
    restaurantName: 'Green Chilli',
    title: 'Earn 5% instead of 2% this weekend',
    detail: 'Valid Friday to Sunday on bills above AED 150.',
    eyebrow: 'Weekend boost',
    accent: '#EAF7F0',
  },
  {
    id: 'offer-operation-falafel',
    restaurantId: 'operation-falafel',
    restaurantName: 'Operation: Falafel',
    title: '10% rewards on orders above AED 75',
    detail: 'Available every day at participating Dubai locations.',
    eyebrow: 'Always on',
    accent: '#FBF1E9',
  },
  {
    id: 'offer-brunch-cake',
    restaurantId: 'brunch-and-cake',
    restaurantName: 'Brunch & Cake',
    title: 'Double rewards before 11 AM',
    detail: 'Start early and earn 10% on breakfast and brunch.',
    eyebrow: 'Morning offer',
    accent: '#F6ECE8',
  },
];

