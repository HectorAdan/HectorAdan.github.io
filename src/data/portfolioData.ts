import { SectorConfig, ProjectItem, ExperienceItem, EducationItem, SkillCategory } from '../types/portfolio';

export const SECTORS: Record<string, SectorConfig> = {
  home: {
    id: 'home',
    label: 'Focal Core',
    code: 'SEC-00',
    description: 'Central Neural Nexus & Digital Avatar Interface',
    position: [0, 0, 0],
    color: '#00f0ff',
    accentColor: '#38bdf8',
  },
  about: {
    id: 'about',
    label: 'About',
    code: 'SEC-01',
    description: 'Identity Matrix, Philosophy, Education & Core Capabilities',
    position: [-5.5, 2.2, -2.5],
    color: '#00f0ff',
    accentColor: '#0ea5e9',
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    code: 'SEC-02',
    description: 'Autonomous Systems, Business Intelligence & High-Scale Interfaces',
    position: [5.5, 2.0, -2.2],
    color: '#38bdf8',
    accentColor: '#6366f1',
  },
  experience: {
    id: 'experience',
    label: 'Experience',
    code: 'SEC-03',
    description: '8+ Years Engineering Enterprise Web, Mobile & Cloud Solutions',
    position: [-4.2, -3.2, -1.8],
    color: '#818cf8',
    accentColor: '#c084fc',
  },
  contact: {
    id: 'contact',
    label: 'Contact',
    code: 'SEC-04',
    description: 'Encrypted Comms, Global Availability & Collaboration Channels',
    position: [4.2, -3.2, -1.8],
    color: '#2dd4bf',
    accentColor: '#00f0ff',
  },
};

export const PERSONAL_INFO = {
  name: 'Hector Morales',
  fullName: 'Hector Adan Morales Lugo',
  title: 'Software Engineer | Frontend Developer',
  tagline: 'Building intuitive digital experiences at the intersection of software engineering, creative design, and AI.',
  location: 'Mexico • Global Remote',
  email: 'hmoralesmaster@gmail.com',
  linkedin: 'https://www.linkedin.com/in/hectoradanmoraleslugo',
  github: 'https://github.com/HectorAdan',
  avatarUrl: 'https://media.licdn.com/dms/image/v2/D4E03AQHDZl7DQmGw0w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1719025238787?e=1767225600&v=beta&t=0XFfJL7s6vkeL8BLjD7-gDpcDUrf2D0BCSAUpU1B4OM',
  status: 'Available for high-impact roles & creative engineering projects',
  yearsExperience: '8+',
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: 'Frontend & 3D Web',
    skills: ['React', 'TypeScript', 'Next.js', 'Three.js / R3F', 'WebGL', 'Tailwind CSS', 'Redux Toolkit', 'Framer Motion'],
  },
  {
    title: 'Mobile Architecture',
    skills: ['React Native', 'Android & iOS', 'Reanimated', 'Gesture Handler', 'Cross-Platform SDKs', 'Mobile Performance'],
  },
  {
    title: 'Backend & Cloud',
    skills: ['Node.js', 'Python / Django', 'REST & GraphQL', 'AWS (S3, Lambda)', 'Firebase', 'PostgreSQL / SQL'],
  },
  {
    title: 'Data & Intelligence',
    skills: ['Business Intelligence', 'Decision Support Systems', 'Data Visualization', 'AI Integration', 'Algorithms'],
  },
];

export const PROJECTS: ProjectItem[] = [
  // --- Personal Projects ---
  {
    id: 'simfinanzas',
    title: 'SimFinanzas — Financial Simulation & Planning',
    company: 'Personal project',
    category: 'FinTech & Data Visualization',
    year: 'Live',
    description: 'A Spanish-language financial simulation and planning platform for Mexico. Combines mortgage and ISR salary calculators with prepayment-versus-investment and buying-versus-renting comparisons, interactive charts, and amortization tables. Includes an account-based income and expense planner with recurring movements, expense priorities, a payment calendar, and monthly or yearly dashboards.',
    tags: ['React', 'TypeScript', 'Redux Toolkit', 'Clerk', 'Turso Cloud'],
    liveUrl: 'https://www.simfinanzas.com/',
    featured: true,
  },
  // --- WestonDEV Projects ---
  {
    id: 'restaurant-pos-mobile',
    title: 'Restaurant Multi-Location POS Mobile App',
    company: 'WestonDEV',
    category: 'Mobile Engineering (Android)',
    year: '2022 - Present',
    description: 'Enterprise point-of-sale mobile app for Android engineered to manage restaurants with multiple organizations, locations, dynamic menus, employees, tables, customers, payments, hardware settings, and analytical reports. Built reservation workflows across Android, web, and handheld devices: create customers, assign tables on the table layout, seat customers, create orders, and track reservation statuses in real time.',
    tags: ['React Native', 'Redux', 'TypeScript', 'Reanimated', 'Gesture Handler', 'Android'],
    metrics: 'Created base architecture, Table Layout Editor & drag-and-drop',
    featured: true,
  },
  {
    id: 'restaurant-management-web',
    title: 'Multi-Location Restaurant Management Web App',
    company: 'WestonDEV',
    category: 'Enterprise Web Application',
    year: '2022 - Present',
    description: 'Comprehensive administrative web platform for multi-location restaurant operations. Created base project, component design system, and drag-and-drop table layout configuration flows. Developed reservation management for customer creation, table assignment, seating, and order creation, with real-time reservation status tracking across web, Android, and handheld devices.',
    tags: ['React', 'Redux', 'TypeScript', 'DND', 'Interactive Layouts'],
    metrics: 'Full organization & branch governance',
    featured: true,
  },
  {
    id: 'online-ordering-web',
    title: 'Online Ordering Food & Menu Platform',
    company: 'WestonDEV',
    category: 'E-Commerce & Digital Menus',
    year: '2023 - 2024',
    description: 'Developed and designed a high-conversion web application for digital menu discovery, customer online ordering, real-time cart adjustments, and seamless payment flows.',
    tags: ['React', 'TypeScript', 'Redux', 'Responsive UI/UX'],
    metrics: 'High-speed ordering flow',
    featured: false,
  },
  {
    id: 'health-company-management',
    title: 'Healthcare Business Management Platform',
    company: 'WestonDEV',
    category: 'HealthTech & Enterprise ERP',
    year: '2022 - 2023',
    description: 'Redesigned existing business management software for a healthcare provider. Revamped UI and UX paradigms, resolved performance bottlenecks, and engineered critical patient and provider workflow features.',
    tags: ['React', 'TypeScript', 'Redux', 'UI/UX Redesign', 'Healthcare Workflows'],
    metrics: 'Overhauled user experience & added enterprise modules',
    featured: true,
  },
  {
    id: 'cruise-line-webapp',
    title: 'Cruise Line Company Web Application',
    company: 'WestonDEV',
    category: 'Travel & Hospitality Web Experience',
    year: '2023',
    description: 'Developed and designed an engaging, modern web application for a premier cruise company, featuring intuitive itinerary navigation, cabin exploration, and polished visual design.',
    tags: ['React', 'TypeScript', 'Modern UI/UX', 'Interactive Web'],
    metrics: 'Tailored maritime booking & discovery interface',
    featured: false,
  },

  // --- Kioscomático Projects ---
  {
    id: 'itacate-delivery-mobile',
    title: 'Itacate — Local Food & Product Delivery App',
    company: 'Kioscomático',
    category: 'On-Demand Mobile Logistics',
    year: '2020 - 2022',
    description: 'Full-featured mobile application for Android and iOS providing on-demand delivery for local food and neighborhood products. Engineered interactive maps, real-time GPS user location, live delivery tracking, and rating systems.',
    tags: ['React Native', 'iOS & Android', 'Google Maps API', 'Geolocation', 'Real-Time Tracking'],
    metrics: 'Production deployment on Google Play & Apple App Store',
    featured: true,
  },
  {
    id: 'itacate-cocinas-mobile',
    title: 'Itacate Cocinas — Merchant & Kitchen App',
    company: 'Kioscomático',
    category: 'Merchant Kitchen Operations',
    year: '2020 - 2022',
    description: 'Dedicated mobile application for partner kitchens and culinary merchants to publish menus, manage incoming orders, track delivery logistics, and view earnings in real-time.',
    tags: ['React Native', 'Android/iOS', 'State Architecture', 'Order Management'],
    metrics: 'Seamless merchant-to-driver workflow',
    featured: false,
  },
  {
    id: 'kioscomatico-billing-web',
    title: 'Corporate Business Management & Billing Platform',
    company: 'Kioscomático',
    category: 'Billing & Corporate Operations',
    year: '2020 - 2021',
    description: 'Engineered a robust web application for enterprise administration, operational reporting, client management, and automated invoicing & electronic billing.',
    tags: ['React', 'Redux', 'TypeScript', 'Webpack', 'Electronic Billing'],
    metrics: 'Scalable corporate invoicing pipeline',
    featured: false,
  },

  // --- Colima Impulsa Project ---
  {
    id: 'colima-fintech-system',
    title: 'Fintech Web Financial Management System',
    company: 'Colima Impulsa',
    category: 'Financial Technologies & REST Architecture',
    year: '2017',
    description: 'Developed and refactored a secure web-based financial system. Redesigned frontend UI/UX and normalized relational databases with optimized Django REST API endpoints for high-accuracy transaction accounting.',
    tags: ['Python', 'Django', 'Django REST Framework', 'JavaScript', 'PostgreSQL'],
    metrics: 'Normalized schema & 35% query latency improvement',
    featured: false,
  },

  // --- Academic & Creative Research Projects ---
  {
    id: 'intelligence-interface',
    title: 'The Intelligence Interface',
    company: 'Creative Lab',
    category: 'Creative 3D & Spatial Web',
    year: '2025',
    description: 'A cinematic, GPU-accelerated spatial portfolio interface built with Three.js, React, and custom shader pipelines mimicking an active digital intelligence cluster.',
    tags: ['React', 'Three.js', 'TypeScript', 'GLSL', 'Spatial Audio'],
    metrics: '60 FPS WebGL • Zero Layout Shifts',
    featured: true,
  },
  {
    id: 'ornalisis',
    title: 'ORNALISIS — BI Decision Support System',
    company: 'TecNM Colima',
    category: 'Business Intelligence & Scientific Research',
    year: '2018 - 2020',
    description: 'Graduate Master\'s thesis & enterprise platform integrating predictive analytics and algorithmic decision-support for commercial ornamental plant logistics. Published in indexed scientific journal.',
    tags: ['Python', 'Django', 'Business Intelligence', 'Data Science', 'JavaScript'],
    metrics: 'Published in 3c Tecnología Journal (Vol. 9, No. 3)',
    featured: true,
  },
  {
    id: 'ayohui',
    title: 'AYOHUI — Collaborative Knowledge Network',
    company: 'Universidad de Colima',
    category: 'Distributed Systems & EdTech',
    year: '2016 - 2018',
    description: 'Networked learning and shared knowledge platform facilitating decentralized collaboration, peer learning modules, and educational content streaming.',
    tags: ['Python', 'Django', 'WebSockets', 'JavaScript', 'PostgreSQL'],
    metrics: 'University-wide adoption & thesis research',
    featured: false,
  },
];

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'westondev',
    role: 'Senior FullStack Javascript Developer',
    company: 'WestonDEV',
    location: 'Miami, Florida, US (Remote)',
    period: 'March 2022 — Present (4+ years)',
    highlights: [
      'Engineered cross-platform POS mobile app for Android to manage restaurants with multi-organization support, table layout editor, menus, employees, payments, and reporting.',
      'Developed administrative web management platform for restaurants utilizing React, Redux, TypeScript, and Drag-and-Drop (DND) interfaces.',
      'Built a reservation system across Android, web, and handheld devices, enabling customer creation, table assignment on the table layout, seating, and order creation with real-time reservation status tracking.',
      'Designed and deployed high-performance online ordering web application for seamless customer ordering and real-time checkout.',
      'Spearheaded complete UI/UX overhaul and feature expansion for a healthcare business management web application.',
      'Developed and designed a modern, responsive web application for a premier cruise company.',
    ],
    skills: ['React', 'React Native', 'TypeScript', 'Redux', 'Reanimated', 'Gesture Handler', 'DND', 'AWS', 'Node.js'],
    projects: [
      {
        title: 'Restaurant POS Android Mobile App',
        description: 'Multi-organization POS system with Table Layout Editor, Drag & Drop table mapping, employee and menu management, and payment processing. Reservation workflows support customer creation, table assignment, seating, and order creation on Android and handheld devices, with real-time reservation status tracking.',
        tech: ['React Native', 'Redux', 'TypeScript', 'Reanimated', 'Gesture Handler'],
      },
      {
        title: 'Restaurant Management Web Platform',
        description: 'Multi-branch operational web suite with Drag-and-Drop table designer and multi-store administration. Includes reservation management from customer creation and table assignment through seating and order creation, with reservation statuses tracked in real time.',
        tech: ['React', 'Redux', 'TypeScript', 'DND'],
      },
      {
        title: 'Online Ordering Web Application',
        description: 'Customer-facing digital menu and checkout web app engineered for frictionless food ordering.',
        tech: ['React', 'TypeScript', 'Responsive UI/UX'],
      },
      {
        title: 'Healthcare Business Management App',
        description: 'Comprehensive UI/UX redesign and functional feature expansion for healthcare provider enterprise management.',
        tech: ['React', 'TypeScript', 'Redux', 'UX Redesign'],
      },
      {
        title: 'Cruise Line Company Web App',
        description: 'Modern, engaging web platform created for a cruise line company featuring interactive maritime experiences.',
        tech: ['React', 'TypeScript', 'UI/UX Design'],
      },
    ],
  },
  {
    id: 'kioscomatico',
    role: 'Software Developer',
    company: 'Kioscomático y Soluciones',
    location: 'Colima, Mexico',
    period: 'March 2020 — March 2022 (2 years 1 month)',
    highlights: [
      'Developed "Itacate" on-demand delivery mobile app for Android/iOS with GPS user location, Google Maps integration, and live order tracking.',
      'Engineered and refactored "Itacate Cocinas" mobile app for commercial kitchens and food merchants to manage digital store operations.',
      'Contributed to the development of an enterprise web application for business management and automated invoicing/billing using React, Redux, and TypeScript.',
    ],
    skills: ['React Native', 'React', 'TypeScript', 'Redux', 'Google Maps API', 'Webpack', 'iOS & Android'],
    projects: [
      {
        title: 'Itacate — Delivery Mobile App (iOS/Android)',
        description: 'On-demand local food and product delivery app featuring live GPS map tracking, routing, and reviews.',
        tech: ['React Native', 'Google Maps API', 'Location Services'],
      },
      {
        title: 'Itacate Cocinas — Kitchen Merchant App',
        description: 'Mobile tool for restaurants to list food products, receive live kitchen tickets, and manage order flow.',
        tech: ['React Native', 'iOS & Android', 'State Management'],
      },
      {
        title: 'Business Management & Billing Web App',
        description: 'Corporate business operations and automated electronic billing platform.',
        tech: ['React', 'Redux', 'TypeScript', 'Webpack'],
      },
    ],
  },
  {
    id: 'colima-impulsa',
    role: 'Python / Django Developer',
    company: 'Colima Impulsa',
    location: 'Colima, Mexico',
    period: 'June 2017 — December 2017 (7 months)',
    highlights: [
      'Contributed to the development and architectural refactoring of a web Finance system as a Full-Stack Developer.',
      'Built and integrated clean RESTful APIs using Python, Django Framework, and Django REST Framework.',
      'Redesigned the frontend interface with JavaScript and improved overall user experience while optimizing database schemas.',
    ],
    skills: ['Python', 'Django', 'Django REST Framework', 'JavaScript', 'PostgreSQL', 'UI/UX'],
    projects: [
      {
        title: 'Web Finance Management System',
        description: 'Full-stack financial software platform with database normalization and redesigned user experience.',
        tech: ['Python', 'Django', 'Django REST Framework', 'JavaScript'],
      },
    ],
  },
];

export const EDUCATION: EducationItem[] = [
  {
    degree: "Master's Degree in Computer Science",
    school: 'Tecnológico Nacional de México Campus Colima',
    period: '2018 — 2020',
    details: 'Specialization in Business Intelligence, Decision Support Systems, and advanced algorithmic engineering. Published thesis research on agricultural commerce optimization in indexed journals.',
  },
  {
    degree: "Bachelor's Degree in Computer Science",
    school: 'Universidad de Colima',
    period: '2014 — 2018',
    details: 'Graduated with strong foundations in software architecture, distributed systems, compiler design, and database systems engineering.',
  },
];
