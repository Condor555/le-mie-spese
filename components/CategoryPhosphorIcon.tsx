import {
  AirplaneTilt,
  AmazonLogo,
  Baby,
  Barbell,
  Bed,
  BookOpen,
  Camera,
  Car,
  Coffee,
  DeviceMobile,
  FilmSlate,
  FirstAidKit,
  ForkKnife,
  GameController,
  GasPump,
  Gift,
  GraduationCap,
  Heart,
  House,
  Laptop,
  MusicNotes,
  Package,
  CarSimpleIcon,
  PawPrint,
  Play,
  Receipt,
  Scissors,
  Scooter,
  ShoppingBag,
  ShoppingCart,
  SoccerBall,
  Stethoscope,
  Tag,
  Ticket,
  Train,
  UsersThree,
} from '@phosphor-icons/react/ssr';

const ICONS: Record<string, typeof Tag> = {
  tag: Tag,
  food: ForkKnife,
  coffee: Coffee,
  cart: ShoppingCart,
  fuel: GasPump,
  train: Train,
  car: Car,
  scooter: Scooter,
  parking: CarSimpleIcon,
  rent: House,
  tax: Receipt,
  wedding: Heart,
  health: FirstAidKit,
  doctor: Stethoscope,
  house: House,
  receipt: Receipt,
  gift: Gift,
  plane: AirplaneTilt,
  play: Play,
  bag: ShoppingBag,
  amazon: AmazonLogo,
  scissors: Scissors,
  football: SoccerBall,
  movie: FilmSlate,
  book: BookOpen,
  ticket: Ticket,
  education: GraduationCap,
  family: UsersThree,
  child: Baby,
  bed: Bed,
  heart: Heart,
  gamepad: GameController,
  phone: DeviceMobile,
  package: Package,
  paw: PawPrint,
  dumbbell: Barbell,
  music: MusicNotes,
  laptop: Laptop,
  camera: Camera,
};

export default function CategoryPhosphorIcon({
  name,
  size = 22,
  className,
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const PhosphorIcon = ICONS[name || ''] || Tag;

  return (
    <PhosphorIcon
      aria-hidden="true"
      className={className}
      size={size}
      weight="duotone"
    />
  );
}
