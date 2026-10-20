import React from 'react';
import {
  Home,
  Utensils,
  Car,
  Compass,
  Tv,
  Package,
  Briefcase,
  Laptop,
  TrendingUp,
  Tag,
  ShoppingBag,
  Zap,
  Coffee,
  HeartPulse,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', size }) => {
  const safeName = (name || '').toLowerCase();
  switch (safeName) {
    case 'home':
    case 'moradia':
      return <Home className={className} size={size} />;
    case 'utensils':
    case 'alimentacao':
    case 'alimentação':
      return <Utensils className={className} size={size} />;
    case 'car':
    case 'transporte':
      return <Car className={className} size={size} />;
    case 'compass':
    case 'lazer':
      return <Compass className={className} size={size} />;
    case 'tv':
    case 'assinaturas':
      return <Tv className={className} size={size} />;
    case 'briefcase':
    case 'salario':
    case 'salário':
      return <Briefcase className={className} size={size} />;
    case 'laptop':
    case 'freelance':
      return <Laptop className={className} size={size} />;
    case 'trendingup':
    case 'investimentos':
      return <TrendingUp className={className} size={size} />;
    case 'shoppingbag':
    case 'compras':
      return <ShoppingBag className={className} size={size} />;
    case 'coffee':
      return <Coffee className={className} size={size} />;
    case 'zap':
      return <Zap className={className} size={size} />;
    case 'heartpulse':
    case 'saude':
      return <HeartPulse className={className} size={size} />;
    default:
      return <Package className={className} size={size} />;
  }
};
