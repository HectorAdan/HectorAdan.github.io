export interface ProjectStory {
  projectId: string;
  title: string;
  discipline: string;
  focus: string;
  platform: string;
  challenge: string;
  contributions: string[];
  engineeringFocus: string;
}

// Editorial expansions of PROJECTS / EXPERIENCES in portfolioData.ts.
// Keep outcomes in the original project records; do not invent metrics or decisions.
export const PROJECT_STORIES: ProjectStory[] = [
  {
    projectId: 'restaurant-pos-mobile',
    title: 'Restaurant POS',
    discipline: 'Application architecture',
    focus: 'Base architecture, table interactions & reservations',
    platform: 'Android, web & handheld',
    challenge: 'Restaurant operations span organizations, locations, menus, employees, tables, customers, and payments. Alongside the Android point-of-sale application, reservation workflows needed to support staff on web and handheld devices, from customer creation and table assignment to seating and order creation, with reservation statuses tracked in real time.',
    contributions: [
      'Created the base architecture for the React Native point-of-sale application.',
      'Built the Table Layout Editor and drag-and-drop table mapping interactions.',
      'Developed a reservation system for Android, web, and handheld devices, allowing staff to create customers, assign tables on the table layout, seat customers, and create orders from the reservation workflow.',
      'Implemented real-time reservation status tracking.',
      'Engineered restaurant workflows covering multi-organization operations, menus, employees, payments, and reporting.',
    ],
    engineeringFocus: 'The work combined application structure with direct manipulation of table layouts and reservation workflows that carry customers from table assignment through seating and order creation. Real-time reservation status tracking supported staff across Android, web, and handheld devices. React Native, Redux, and TypeScript formed the mobile stack, with Reanimated and Gesture Handler supporting the interactive side of the application; the web platform used React, Redux, and TypeScript.',
  },
  {
    projectId: 'itacate-delivery-mobile',
    title: 'Itacate delivery',
    discipline: 'Location-based mobile experiences',
    focus: 'Maps, location & delivery tracking',
    platform: 'Android & iOS',
    challenge: 'Local food and neighborhood product delivery depends on knowing where customers and orders are. Itacate needed a mobile experience that connected on-demand ordering with location awareness and live delivery tracking.',
    contributions: [
      'Developed the React Native delivery application for Android and iOS.',
      'Engineered interactive maps and real-time GPS user location with Google Maps integration.',
      'Implemented live delivery tracking and rating systems.',
    ],
    engineeringFocus: 'Maps and location were central to the product experience. The engineering work connected a cross-platform React Native interface with Google Maps, geolocation, and live order tracking so customers could follow their deliveries.',
  },
  {
    projectId: 'ornalisis',
    title: 'ORNALISIS',
    discipline: 'Business intelligence & research',
    focus: 'Predictive analytics & decision support',
    platform: 'Web / Python & Django',
    challenge: 'Commercial ornamental plant logistics was the domain for a research platform focused on business intelligence and decision support. The project brought predictive analytics and algorithmic support into an enterprise web application.',
    contributions: [
      "Developed the platform as part of my Master's thesis in Computer Science.",
      'Integrated predictive analytics and algorithmic decision support for commercial ornamental plant logistics.',
      'Published the thesis research in an indexed scientific journal.',
    ],
    engineeringFocus: 'This project connected academic research with application development. Python, Django, and JavaScript supported the platform, while business intelligence and data science shaped its analytical focus.',
  },
];
