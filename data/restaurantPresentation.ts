import type { ImageSourcePropType } from 'react-native';

type RestaurantPresentation = {
  image: ImageSourcePropType;
  distance: string;
  rating: number;
  accent: string;
  hours: string;
  offer?: string;
  popular?: boolean;
};

export const restaurantPresentation: Record<string, RestaurantPresentation> = {
  'green-chilli': {
    image: require('../assets/restaurants/green-chilli.png'),
    distance: '1.2 km',
    rating: 4.8,
    accent: '#DCEEE4',
    hours: 'Open today · 12 PM–11:30 PM',
    offer: 'Earn 5% instead of 2% this weekend',
    popular: true,
  },
  'operation-falafel': {
    image: require('../assets/restaurants/operation-falafel.png'),
    distance: '2.4 km',
    rating: 4.7,
    accent: '#F4E8D6',
    hours: 'Open today · 8 AM–1 AM',
    offer: '10% rewards on orders above AED 75',
    popular: true,
  },
  'brunch-and-cake': {
    image: require('../assets/restaurants/brunch-and-cake.png'),
    distance: '3.1 km',
    rating: 4.6,
    accent: '#F5E7E1',
    hours: 'Open today · 8 AM–10 PM',
    offer: 'Double rewards before 11 AM',
  },
  'reif-japanese-kushiyaki': {
    image: require('../assets/restaurants/reif-japanese-kushiyaki.png'),
    distance: '4.6 km',
    rating: 4.9,
    accent: '#E8E3DE',
    hours: 'Open today · 12 PM–11 PM',
    popular: true,
  },
};
