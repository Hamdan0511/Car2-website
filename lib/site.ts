export const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#performance", label: "Performance" },
  { href: "#design", label: "Design" },
  { href: "#technology", label: "Technology" },
  { href: "#gallery", label: "Gallery" },
] as const;

/** Every navigable section, in page order (mobile menu and footer). */
export const SECTION_LINKS = [
  ...NAV_LINKS.slice(0, 4),
  { href: "#engineering", label: "Engineering" },
  NAV_LINKS[4],
  { href: "#redline", label: "Redline" },
] as const;

export const IMAGES = {
  heroSilver: {
    src: "/images/fizz-hero-silver.webp",
    width: 1860,
    height: 724,
    alt: "Silver FIZZ supercar in front three-quarter view on a wet salt flat, mountains and a sunset sky behind it",
  },
  silverFront: {
    src: "/images/fizz-silver-front.webp",
    width: 2172,
    height: 724,
    alt: "Silver FIZZ supercar seen from the opposite front three-quarter angle, its headlights lit against a dusk sky",
  },
  rearSunset: {
    src: "/images/fizz-rear-sunset.webp",
    width: 2172,
    height: 724,
    alt: "Low rear three-quarter view of the FIZZ supercar, red light blade glowing as the sun sets over the mountains",
  },
  redline: {
    src: "/images/fizz-redline-overhead.webp",
    width: 2171,
    height: 724,
    alt: "Overhead rear view of a black FIZZ supercar with a crimson light spine and light blade in a red haze",
  },
} as const;
