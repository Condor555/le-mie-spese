import type {ComponentType} from 'react';
import {
  AirplaneIcon, AmbulanceIcon, ArrowCircleUpIcon, ArrowCounterClockwiseIcon,
  BabyIcon, BankIcon, BarbellIcon, BedIcon, BicycleIcon, BookOpenIcon,
  BriefcaseIcon, BusIcon, CalculatorIcon, CameraIcon, CarIcon, CarSimpleIcon,
  CoinsIcon, CoffeeIcon, CreditCardIcon, CurrencyEurIcon, DeviceMobileIcon,
  DotsThreeIcon, FilmSlateIcon, FirstAidKitIcon, ForkKnifeIcon,
  GameControllerIcon, GasPumpIcon, GiftIcon, GraduationCapIcon, HandbagIcon,
  HeartIcon, HeartbeatIcon, HospitalIcon, HouseIcon, LaptopIcon, MoneyIcon,
  MotorcycleIcon, MusicNotesIcon, PackageIcon, PawPrintIcon, PiggyBankIcon,
  PillIcon, PlayIcon, ReceiptIcon, RepeatIcon, ScissorsIcon, ShoppingBagIcon,
  ShoppingCartIcon, SoccerBallIcon, StarIcon, StorefrontIcon, StethoscopeIcon,
  TagIcon, TaxiIcon, TicketIcon, TrainIcon, TruckIcon, UsersThreeIcon,
  WalletIcon, WarningCircleIcon, WrenchIcon,
} from '@phosphor-icons/react/ssr';
import BrandMark from './BrandMark';
import {findIconEntry} from '../lib/category-icon-catalog';

type PhosphorComponent = ComponentType<{
  size?: number | string;
  color?: string;
  weight?: 'thin'|'light'|'regular'|'bold'|'fill'|'duotone';
  className?: string;
  'aria-hidden'?: boolean;
}>;

const components: Record<string, PhosphorComponent> = {
  AirplaneIcon, AmbulanceIcon, ArrowCircleUpIcon, ArrowCounterClockwiseIcon,
  BabyIcon, BankIcon, BarbellIcon, BedIcon, BicycleIcon, BookOpenIcon,
  BriefcaseIcon, BusIcon, CalculatorIcon, CameraIcon, CarIcon, CarSimpleIcon,
  CoinsIcon, CoffeeIcon, CreditCardIcon, CurrencyEurIcon, DeviceMobileIcon,
  DotsThreeIcon, FilmSlateIcon, FirstAidKitIcon, ForkKnifeIcon,
  GameControllerIcon, GasPumpIcon, GiftIcon, GraduationCapIcon, HandbagIcon,
  HeartIcon, HeartbeatIcon, HospitalIcon, HouseIcon, LaptopIcon, MoneyIcon,
  MotorcycleIcon, MusicNotesIcon, PackageIcon, PawPrintIcon, PiggyBankIcon,
  PillIcon, PlayIcon, ReceiptIcon, RepeatIcon, ScissorsIcon, ShoppingBagIcon,
  ShoppingCartIcon, SoccerBallIcon, StarIcon, StorefrontIcon, StethoscopeIcon,
  TagIcon, TaxiIcon, TicketIcon, TrainIcon, TruckIcon, UsersThreeIcon,
  WalletIcon, WarningCircleIcon, WrenchIcon,
};

export default function CategoryPhosphorIcon({icon,size=22,color='currentColor',className}:{icon?:string|null;size?:number;color?:string;className?:string}) {
  if(icon?.startsWith('brand:'))return <BrandMark id={icon} size={size}/>;
  const entry=findIconEntry(icon)||findIconEntry('tag');
  const Glyph=(entry&&components[entry.component])||TagIcon;
  return <Glyph size={size} color={color} weight="duotone" className={className} aria-hidden/>;
}
