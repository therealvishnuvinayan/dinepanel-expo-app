import type { Restaurant } from '@/types';

export const restaurants: Restaurant[] = [
  {
    id: 'green-chilli',
    slug: 'green-chilli',
    name: 'Green Chilli',
    cuisine: 'Indian',
    rewardPercent: 2,
    distance: '1.2 km',
    neighborhood: 'Downtown Dubai',
    rating: 4.8,
    image: require('../assets/restaurants/green-chilli.png'),
    accent: '#DCEEE4',
    description:
      'Contemporary Indian plates, warm hospitality and a dining room made for unhurried evenings.',
    address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
    hours: 'Open today · 12 PM–11:30 PM',
    offer: 'Earn 5% instead of 2% this weekend',
    popular: true,
  },
  {
    id: 'operation-falafel',
    slug: 'operation-falafel',
    name: 'Operation: Falafel',
    cuisine: 'Middle Eastern',
    rewardPercent: 10,
    distance: '2.4 km',
    neighborhood: 'Business Bay',
    rating: 4.7,
    image: require('../assets/restaurants/operation-falafel.png'),
    accent: '#F4E8D6',
    description:
      'Freshly prepared street-food favourites with a modern, distinctly local point of view.',
    address: 'Bay Avenue, Business Bay, Dubai',
    hours: 'Open today · 8 AM–1 AM',
    offer: '10% rewards on orders above AED 75',
    popular: true,
  },
  {
    id: 'brunch-and-cake',
    slug: 'brunch-and-cake',
    name: 'Brunch & Cake',
    cuisine: 'Cafe',
    rewardPercent: 5,
    distance: '3.1 km',
    neighborhood: 'Jumeirah Islands',
    rating: 4.6,
    image: require('../assets/restaurants/brunch-and-cake.png'),
    accent: '#F5E7E1',
    description:
      'Generous all-day brunch plates served in a bright, relaxed space with plenty of character.',
    address: 'The Pointe, Jumeirah, Dubai',
    hours: 'Open today · 8 AM–10 PM',
    offer: 'Double rewards before 11 AM',
  },
  {
    id: 'reif-japanese-kushiyaki',
    slug: 'reif-japanese-kushiyaki',
    name: 'Reif Japanese Kushiyaki',
    cuisine: 'Japanese',
    rewardPercent: 4,
    distance: '4.6 km',
    neighborhood: 'Dar Wasl',
    rating: 4.9,
    image: require('../assets/restaurants/reif-japanese-kushiyaki.png'),
    accent: '#E8E3DE',
    description:
      'Inventive kushiyaki and Japanese comfort food in an intimate, understated setting.',
    address: 'Dar Wasl Mall, Al Wasl Road, Dubai',
    hours: 'Open today · 12 PM–11 PM',
    popular: true,
  },
];

export const getRestaurant = (id: string) =>
  restaurants.find((restaurant) => restaurant.id === id) ?? restaurants[0];
