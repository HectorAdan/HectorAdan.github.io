export type SectorId = 'home' | 'about' | 'projects' | 'experience' | 'contact';

export interface SectorConfig {
  id: SectorId;
  label: string;
  code: string; // e.g. "SEC-01"
  description: string;
  position: [number, number, number];
  color: string;
  accentColor: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  company?: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  metrics?: string;
  liveUrl?: string;
  githubUrl?: string;
  featured?: boolean;
}

export interface CompanyProject {
  title: string;
  description: string;
  tech?: string[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  highlights: string[];
  skills: string[];
  projects?: CompanyProject[];
}

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
  details: string;
}

export interface SkillCategory {
  title: string;
  skills: string[];
}
