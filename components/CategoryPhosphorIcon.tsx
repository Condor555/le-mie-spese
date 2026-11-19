import type { ComponentProps } from 'react';
import {
  AirplaneTiltIcon,
  AmazonLogoIcon,
  BabyIcon,
  BarbellIcon,
  BedIcon,
  BookOpenIcon,
  CameraIcon,
  CarIcon,
  CoffeeIcon,
  DeviceMobileIcon,
  FilmSlateIcon,
  FirstAidIcon,
  ForkKnifeIcon,
  GameControllerIcon,
  GasPumpIcon,
  GiftIcon,
  GraduationCapIcon,
  HeartIcon,
  HouseIcon,
  LaptopIcon,
  MapPinIcon,
  MusicNotesIcon,
  PackageIcon,
  PawPrintIcon,
  PlayIcon,
  ReceiptIcon,
  ScissorsIcon,
  ScooterIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SoccerBallIcon,
  StethoscopeIcon,
  TagIcon,
  TicketIcon,
  TrainIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react/ssr';

type PhosphorIcon = typeof TagIcon;
type PhosphorIconProps = ComponentProps<typeof TagIcon>;

const CATEGORY_ICONS: Record<string, PhosphorIcon> = {
  amazon: AmazonLogoIcon,
  bag: ShoppingBagIcon,
  bed: BedIcon,
  book: BookOpenIcon,
  camera: CameraIcon,
  car: CarIcon,
  cart: ShoppingCartIcon,
  child: BabyIcon,
  coffee: CoffeeIcon,
  doctor: StethoscopeIcon,
  dumbbell: BarbellIcon,
  education: GraduationCapIcon,
  family: UsersThreeIcon,
  food: ForkKnifeIcon,
  football: SoccerBallIcon,
  fuel: GasPumpIcon,
  gamepad: GameControllerIcon,
  gift: GiftIcon,
  health: FirstAidIcon,
  heart: HeartIcon,
  house: HouseIcon,
  laptop: LaptopIcon,
  movie: FilmSlateIcon,
  music: MusicNotesIcon,
  package: PackageIcon,
  parking: MapPinIcon,
  paw: PawPrintIcon,
  phone: DeviceMobileIcon,
  plane: AirplaneTiltIcon,
  play: PlayIcon,
  receipt: ReceiptIcon,
  rent: HouseIcon,
  scissors: ScissorsIcon,
  scooter: ScooterIcon,
  tag: TagIcon,
  tax: ReceiptIcon,
  ticket: TicketIcon,
  train: TrainIcon,
  wedding: HeartIcon,
};

type CategoryPhosphorIconProps = {
  name?: string | null;
  size?: number;
  color?: string;
  className?: string;
} & Pick<PhosphorIconProps, 'aria-label'>;

export default function CategoryPhosphorIcon({
  name,
  size = 22,
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
}: CategoryPhosphorIconProps) {
  const Icon = CATEGORY_ICONS[name || ''] || TagIcon;

  return (
    <Icon
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={className}
      color={color}
      focusable={false}
      size={size}
      weight="duotone"
    />
  );
}
