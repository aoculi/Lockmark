import {
  Anchor,
  Apple,
  Archive,
  Atom,
  Baby,
  Banknote,
  Beaker,
  Bell,
  Bike,
  Bitcoin,
  Book,
  Bookmark,
  Bot,
  Brain,
  Briefcase,
  Bug,
  Building,
  Bus,
  Cake,
  Calculator,
  Calendar,
  Camera,
  Car,
  Cat,
  ChefHat,
  Chrome,
  Clapperboard,
  Clipboard,
  Clock,
  Cloud,
  Code,
  Codepen,
  Coffee,
  Compass,
  Cpu,
  CreditCard,
  Crown,
  Database,
  Diamond,
  Dices,
  Dog,
  DollarSign,
  Download,
  Dribbble,
  Drum,
  Dumbbell,
  Ear,
  Edit,
  Egg,
  Euro,
  Eye,
  Facebook,
  Feather,
  Figma,
  Film,
  Fingerprint,
  Fish,
  Flag,
  Flame,
  Flashlight,
  FlaskConical,
  Flower,
  Folder,
  Gamepad2,
  Gem,
  Ghost,
  Gift,
  Github,
  Gitlab,
  Globe,
  GraduationCap,
  Grape,
  Grid3X3,
  Guitar,
  Hammer,
  HandMetal,
  HardDrive,
  Headphones,
  Heart,
  Hexagon,
  Highlighter,
  Home,
  Hourglass,
  IceCream,
  Image,
  Inbox,
  Instagram,
  Key,
  Lamp,
  Landmark,
  Languages,
  Laptop,
  Layers,
  Leaf,
  Library,
  Lightbulb,
  Link,
  Linkedin,
  Lock,
  Mail,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic,
  Microscope,
  Monitor,
  Moon,
  Mountain,
  MousePointer,
  Music,
  Navigation,
  Network,
  Newspaper,
  Palette,
  Paperclip,
  PawPrint,
  Pen,
  Pencil,
  Phone,
  PiggyBank,
  Pin,
  Pizza,
  Plane,
  Play,
  Plug,
  Podcast,
  Printer,
  Puzzle,
  QrCode,
  Radio,
  Rocket,
  Rss,
  Ruler,
  Sailboat,
  Save,
  Scale,
  School,
  Scissors,
  Search,
  Send,
  Server,
  Settings,
  Share,
  Shield,
  Ship,
  ShoppingBag,
  ShoppingCart,
  Shrub,
  Skull,
  Slack,
  Smartphone,
  Smile,
  Snowflake,
  Sparkles,
  Speaker,
  Sprout,
  Star,
  Stethoscope,
  Store,
  Sun,
  Sunrise,
  Sword,
  Syringe,
  Tablet,
  Tag,
  Target,
  Telescope,
  Tent,
  Terminal,
  ThumbsUp,
  Ticket,
  Timer,
  ToggleLeft,
  Tornado,
  Train,
  Trash,
  TreePine,
  Trophy,
  Truck,
  Tv,
  Twitter,
  Umbrella,
  University,
  Upload,
  Usb,
  User,
  Users,
  Utensils,
  Video,
  Voicemail,
  Volume2,
  Wallet,
  Watch,
  Waves,
  Webcam,
  Wifi,
  Wind,
  Wine,
  Wrench,
  X,
  Youtube,
  Zap,
  type LucideIcon
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import Input from '@/components/ui/Input'

import styles from './styles.module.css'

// Available icons for collections - organized by category for easier searching
export const COLLECTION_ICONS: { name: string; Icon: LucideIcon }[] = [
  // Common / General
  { name: 'Folder', Icon: Folder },
  { name: 'Star', Icon: Star },
  { name: 'Heart', Icon: Heart },
  { name: 'Bookmark', Icon: Bookmark },
  { name: 'Tag', Icon: Tag },
  { name: 'Pin', Icon: Pin },
  { name: 'Flag', Icon: Flag },
  { name: 'Archive', Icon: Archive },
  { name: 'Inbox', Icon: Inbox },
  { name: 'Save', Icon: Save },
  { name: 'Layers', Icon: Layers },
  { name: 'Grid', Icon: Grid3X3 },

  // Work / Business
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'Building', Icon: Building },
  { name: 'Clipboard', Icon: Clipboard },
  { name: 'Calendar', Icon: Calendar },
  { name: 'Clock', Icon: Clock },
  { name: 'Mail', Icon: Mail },
  { name: 'Send', Icon: Send },
  { name: 'Megaphone', Icon: Megaphone },
  { name: 'Target', Icon: Target },
  { name: 'Trophy', Icon: Trophy },

  // Technology
  { name: 'Code', Icon: Code },
  { name: 'Terminal', Icon: Terminal },
  { name: 'Bug', Icon: Bug },
  { name: 'Cpu', Icon: Cpu },
  { name: 'Database', Icon: Database },
  { name: 'Server', Icon: Server },
  { name: 'HardDrive', Icon: HardDrive },
  { name: 'Laptop', Icon: Laptop },
  { name: 'Monitor', Icon: Monitor },
  { name: 'Smartphone', Icon: Smartphone },
  { name: 'Tablet', Icon: Tablet },
  { name: 'Bot', Icon: Bot },
  { name: 'Network', Icon: Network },
  { name: 'Wifi', Icon: Wifi },
  { name: 'Usb', Icon: Usb },
  { name: 'Plug', Icon: Plug },
  { name: 'QrCode', Icon: QrCode },

  // Design / Creative
  { name: 'Palette', Icon: Palette },
  { name: 'Pen', Icon: Pen },
  { name: 'Pencil', Icon: Pencil },
  { name: 'Edit', Icon: Edit },
  { name: 'Highlighter', Icon: Highlighter },
  { name: 'Scissors', Icon: Scissors },
  { name: 'Ruler', Icon: Ruler },
  { name: 'Image', Icon: Image },
  { name: 'Camera', Icon: Camera },
  { name: 'Video', Icon: Video },
  { name: 'Film', Icon: Film },
  { name: 'Clapperboard', Icon: Clapperboard },
  { name: 'Figma', Icon: Figma },

  // Media / Entertainment
  { name: 'Music', Icon: Music },
  { name: 'Headphones', Icon: Headphones },
  { name: 'Speaker', Icon: Speaker },
  { name: 'Mic', Icon: Mic },
  { name: 'Radio', Icon: Radio },
  { name: 'Podcast', Icon: Podcast },
  { name: 'Play', Icon: Play },
  { name: 'Tv', Icon: Tv },
  { name: 'Gamepad2', Icon: Gamepad2 },
  { name: 'Dices', Icon: Dices },
  { name: 'Puzzle', Icon: Puzzle },
  { name: 'Guitar', Icon: Guitar },
  { name: 'Drum', Icon: Drum },

  // Social
  { name: 'Users', Icon: Users },
  { name: 'User', Icon: User },
  { name: 'MessageCircle', Icon: MessageCircle },
  { name: 'Phone', Icon: Phone },
  { name: 'Share', Icon: Share },
  { name: 'ThumbsUp', Icon: ThumbsUp },
  { name: 'Smile', Icon: Smile },

  // Social Media
  { name: 'Github', Icon: Github },
  { name: 'Gitlab', Icon: Gitlab },
  { name: 'Twitter', Icon: Twitter },
  { name: 'Facebook', Icon: Facebook },
  { name: 'Instagram', Icon: Instagram },
  { name: 'Linkedin', Icon: Linkedin },
  { name: 'Youtube', Icon: Youtube },
  { name: 'Dribbble', Icon: Dribbble },
  { name: 'Codepen', Icon: Codepen },
  { name: 'Slack', Icon: Slack },
  { name: 'Chrome', Icon: Chrome },
  { name: 'Rss', Icon: Rss },

  // Education / Science
  { name: 'Book', Icon: Book },
  { name: 'Library', Icon: Library },
  { name: 'GraduationCap', Icon: GraduationCap },
  { name: 'School', Icon: School },
  { name: 'University', Icon: University },
  { name: 'Brain', Icon: Brain },
  { name: 'Lightbulb', Icon: Lightbulb },
  { name: 'Atom', Icon: Atom },
  { name: 'Beaker', Icon: Beaker },
  { name: 'FlaskConical', Icon: FlaskConical },
  { name: 'Microscope', Icon: Microscope },
  { name: 'Telescope', Icon: Telescope },
  { name: 'Calculator', Icon: Calculator },
  { name: 'Languages', Icon: Languages },

  // Finance
  { name: 'Wallet', Icon: Wallet },
  { name: 'CreditCard', Icon: CreditCard },
  { name: 'Banknote', Icon: Banknote },
  { name: 'DollarSign', Icon: DollarSign },
  { name: 'Euro', Icon: Euro },
  { name: 'Bitcoin', Icon: Bitcoin },
  { name: 'PiggyBank', Icon: PiggyBank },
  { name: 'Scale', Icon: Scale },
  { name: 'Landmark', Icon: Landmark },

  // Shopping
  { name: 'ShoppingBag', Icon: ShoppingBag },
  { name: 'ShoppingCart', Icon: ShoppingCart },
  { name: 'Store', Icon: Store },
  { name: 'Gift', Icon: Gift },
  { name: 'Ticket', Icon: Ticket },

  // Travel / Places
  { name: 'Plane', Icon: Plane },
  { name: 'Car', Icon: Car },
  { name: 'Bus', Icon: Bus },
  { name: 'Train', Icon: Train },
  { name: 'Truck', Icon: Truck },
  { name: 'Ship', Icon: Ship },
  { name: 'Sailboat', Icon: Sailboat },
  { name: 'Bike', Icon: Bike },
  { name: 'Map', Icon: Map },
  { name: 'MapPin', Icon: MapPin },
  { name: 'Compass', Icon: Compass },
  { name: 'Navigation', Icon: Navigation },
  { name: 'Globe', Icon: Globe },

  // Home / Lifestyle
  { name: 'Home', Icon: Home },
  { name: 'Lamp', Icon: Lamp },
  { name: 'Utensils', Icon: Utensils },
  { name: 'ChefHat', Icon: ChefHat },
  { name: 'Coffee', Icon: Coffee },
  { name: 'Wine', Icon: Wine },
  { name: 'Pizza', Icon: Pizza },
  { name: 'Apple', Icon: Apple },
  { name: 'Egg', Icon: Egg },
  { name: 'Cake', Icon: Cake },
  { name: 'IceCream', Icon: IceCream },
  { name: 'Grape', Icon: Grape },

  // Health / Fitness
  { name: 'Dumbbell', Icon: Dumbbell },
  { name: 'Stethoscope', Icon: Stethoscope },
  { name: 'Syringe', Icon: Syringe },
  { name: 'Baby', Icon: Baby },

  // Nature / Weather
  { name: 'Sun', Icon: Sun },
  { name: 'Moon', Icon: Moon },
  { name: 'Cloud', Icon: Cloud },
  { name: 'Snowflake', Icon: Snowflake },
  { name: 'Wind', Icon: Wind },
  { name: 'Waves', Icon: Waves },
  { name: 'Tornado', Icon: Tornado },
  { name: 'Umbrella', Icon: Umbrella },
  { name: 'Flame', Icon: Flame },
  { name: 'Sunrise', Icon: Sunrise },
  { name: 'Mountain', Icon: Mountain },
  { name: 'TreePine', Icon: TreePine },
  { name: 'Flower', Icon: Flower },
  { name: 'Leaf', Icon: Leaf },
  { name: 'Sprout', Icon: Sprout },
  { name: 'Shrub', Icon: Shrub },

  // Animals
  { name: 'Cat', Icon: Cat },
  { name: 'Dog', Icon: Dog },
  { name: 'Fish', Icon: Fish },
  { name: 'PawPrint', Icon: PawPrint },
  { name: 'Feather', Icon: Feather },

  // Tools / Settings
  { name: 'Settings', Icon: Settings },
  { name: 'Wrench', Icon: Wrench },
  { name: 'Hammer', Icon: Hammer },
  { name: 'Key', Icon: Key },
  { name: 'Lock', Icon: Lock },
  { name: 'Shield', Icon: Shield },
  { name: 'Fingerprint', Icon: Fingerprint },
  { name: 'Search', Icon: Search },
  { name: 'Eye', Icon: Eye },
  { name: 'Bell', Icon: Bell },
  { name: 'Timer', Icon: Timer },
  { name: 'Hourglass', Icon: Hourglass },
  { name: 'ToggleLeft', Icon: ToggleLeft },
  { name: 'Printer', Icon: Printer },
  { name: 'Webcam', Icon: Webcam },
  { name: 'Flashlight', Icon: Flashlight },
  { name: 'Watch', Icon: Watch },

  // Files / Documents
  { name: 'Newspaper', Icon: Newspaper },
  { name: 'Paperclip', Icon: Paperclip },
  { name: 'Link', Icon: Link },
  { name: 'Download', Icon: Download },
  { name: 'Upload', Icon: Upload },

  // Misc / Fun
  { name: 'Rocket', Icon: Rocket },
  { name: 'Zap', Icon: Zap },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Crown', Icon: Crown },
  { name: 'Diamond', Icon: Diamond },
  { name: 'Gem', Icon: Gem },
  { name: 'Hexagon', Icon: Hexagon },
  { name: 'Anchor', Icon: Anchor },
  { name: 'Tent', Icon: Tent },
  { name: 'Sword', Icon: Sword },
  { name: 'HandMetal', Icon: HandMetal },
  { name: 'Skull', Icon: Skull },
  { name: 'Ghost', Icon: Ghost },
  { name: 'Ear', Icon: Ear },
  { name: 'MousePointer', Icon: MousePointer },
  { name: 'Voicemail', Icon: Voicemail },
  { name: 'Volume2', Icon: Volume2 },
  { name: 'Trash', Icon: Trash }
]

// Helper to get icon component by name
export function getIconByName(name: string): LucideIcon {
  const found = COLLECTION_ICONS.find((i) => i.name === name)
  return found?.Icon ?? Folder
}

interface IconPickerProps {
  value?: string
  onChange: (icon: string | undefined) => void
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current selected icon
  const selectedIcon = useMemo(() => {
    if (!value) return null
    return COLLECTION_ICONS.find((i) => i.name === value) || null
  }, [value])

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (query === '') return COLLECTION_ICONS
    return COLLECTION_ICONS.filter((icon) =>
      icon.name.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Handle icon selection
  const handleSelectIcon = (iconName: string) => {
    onChange(iconName)
    setSearchQuery('')
    setIsOpen(false)
  }

  // Handle clear icon
  const handleClearIcon = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter' && filteredIcons.length > 0) {
      e.preventDefault()
      handleSelectIcon(filteredIcons[0].name)
    }
  }

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const SelectedIconComponent = selectedIcon?.Icon

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Trigger square */}
      <button
        type='button'
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title={selectedIcon ? selectedIcon.name : 'Select an icon'}
      >
        {SelectedIconComponent ? (
          <SelectedIconComponent size={20} />
        ) : (
          <X size={16} className={styles.noIcon} />
        )}
      </button>

      {/* Dropdown with search and icons */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <Input
              ref={inputRef}
              placeholder='Search icons...'
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value)
              }}
              onKeyDown={handleKeyDown}
            >
              <Sparkles size={14} />
            </Input>

            {/* Clear button inside dropdown */}
            {selectedIcon && (
              <button
                type='button'
                className={styles.clearButton}
                onClick={handleClearIcon}
                title='Remove icon'
              >
                <X size={14} />
              </button>
            )}
          </div>

          {filteredIcons.length === 0 ? (
            <div className={styles.noResults}>No icons found</div>
          ) : (
            <div className={styles.iconGrid}>
              {filteredIcons.map(({ name, Icon }) => (
                <button
                  key={name}
                  type='button'
                  className={`${styles.iconButton} ${
                    value === name ? styles.selected : ''
                  }`}
                  onClick={() => handleSelectIcon(name)}
                  title={name}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
