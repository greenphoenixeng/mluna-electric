export const SITE = {
  name: 'M. Luna Electric',
  legalName: 'M. Luna Electric, Inc.',
  url: 'https://mlunaelectric.com',
  description:
    'M. Luna Electric — Licensed electricians serving Kennett Square, Chester & Delaware County, PA. Residential, commercial, and new construction electrical services.',
  phone: '+16105465128',
  phoneDisplay: '(610) 546-5128',
  email: 'Info@mlunaelectricinc.com',
  hours: 'Mon–Fri 7am–6pm',
  hoursExtended: 'Mon–Fri 7am–6pm · Sat by Appt',
  address: {
    locality: 'Kennett Square',
    region: 'PA',
    postalCode: '19348',
    country: 'US',
  },
  areaServed: [
    'Kennett Square, PA', 'West Chester, PA', 'Coatesville, PA',
    'Downingtown, PA', 'Malvern, PA', 'Exton, PA', 'Oxford, PA',
    'Media, PA', 'Newtown Square, PA', 'Havertown, PA',
  ],
} as const;

export const TEL_HREF = `tel:${SITE.phone}`;
export const MAILTO_HREF = `mailto:${SITE.email}`;

export const NAV_LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/#estimator', label: 'Estimator' },
  { href: '/#area', label: 'Service Area' },
  { href: '/#contact', label: 'Contact' },
] as const;

export const SERVICE_NAMES = [
  'Residential Electrical',
  'Commercial Electrical',
  'Panel Upgrades',
  'New Construction',
  'EV Charger Installation',
  'Lighting Installation',
  'Generator Installation',
] as const;
