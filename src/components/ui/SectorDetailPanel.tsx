import { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight, ArrowRight, ArrowLeft, Copy, Check, Mail, Linkedin, Github } from 'lucide-react';
import { SectorId } from '../../types/portfolio';
import { SECTORS, PERSONAL_INFO, EXPERIENCES, EDUCATION, SKILL_CATEGORIES } from '../../data/portfolioData';
import { ProjectGallery } from './ProjectGallery';
import { TechnologyTags as Tags } from './TechnologyTags';
import './SectorDetailPanel.css';

interface SectorDetailPanelProps {
  activeSector: SectorId;
  onClose: () => void;
  onSelectSector: (sector: SectorId) => void;
}

const sections: SectorId[] = ['about', 'projects', 'experience', 'contact'];
const introductions: Record<string, string> = {
  about: 'Engineering depth. Creative perspective.',
  projects: 'Applications built for the real world.',
  experience: 'A career shaped by building.',
  contact: 'Good work starts with a conversation.',
};
export function SectorDetailPanel({ activeSector, onClose, onSelectSector }: SectorDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitted, setTransmitted] = useState(false);
  const [projectFilter, setProjectFilter] = useState('ALL');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dispatchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => {
    clearTimeout(copyTimer.current);
    clearTimeout(dispatchTimer.current);
    clearTimeout(resetTimer.current);
  }, []);

  const handleCopyEmail = async () => {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(PERSONAL_INFO.email);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
    copyTimer.current = setTimeout(() => { setCopied(false); setCopyError(false); }, 2200);
  };

  // Preserve the original prototype interaction and clearly identify it as a demo.
  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactMessage.trim() || isTransmitting || transmitted) return;
    setIsTransmitting(true);
    dispatchTimer.current = setTimeout(() => {
      setIsTransmitting(false);
      setTransmitted(true);
      resetTimer.current = setTimeout(() => {
        setTransmitted(false);
        setContactMessage('');
      }, 4000);
    }, 1200);
  };

  if (activeSector === 'home') return null;

  const sectionIndex = sections.indexOf(activeSector);
  const nextSection = sections[(sectionIndex + 1) % sections.length];

  return (
    <aside className="sector-panel" role="dialog" aria-labelledby="sector-panel-title" aria-modal="true">
      <header className="panel-header">
        <div className="panel-topline">
          <span className="panel-eyebrow">Hector Morales / Portfolio</span>
          <button onClick={onClose} className="panel-close" aria-label="Close sector panel and return to central core (Esc)" title="Return to Core (Esc)">
            <span>Esc</span><X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="panel-heading-row">
          <h2 id="sector-panel-title">{SECTORS[activeSector].label}<span>.</span></h2>
          <span className="panel-number" aria-hidden="true">0{sectionIndex + 1}</span>
        </div>
        <p className="panel-introduction">{introductions[activeSector]}</p>
      </header>

      <nav className="panel-navigation" aria-label="Portfolio sections">
        {sections.map(section => <button key={section} onClick={() => onSelectSector(section)} aria-current={activeSector === section ? 'page' : undefined}>
          {SECTORS[section].label}
        </button>)}
      </nav>

      <div key={activeSector} className="panel-content custom-scrollbar">
        {activeSector === 'about' && <div className="panel-section-stack">
          <section className="panel-profile" aria-labelledby="profile-title">
            <h3 id="profile-title" className="panel-section-label">Philosophy & profile</h3>
            <p>I am a Software Engineer and Senior Fullstack Developer with over 8 years of experience building high-performance web applications, scalable mobile architectures, and responsive spatial interfaces.</p>
            <p>My academic foundation includes a Master's Degree in Computer Science with research in Business Intelligence and Decision Support Systems. I bridge theoretical computing depth with modern, creative user experiences and emerging AI interfaces.</p>
          </section>

          <section aria-labelledby="skills-title">
            <h3 id="skills-title" className="panel-section-label">Technical capabilities</h3>
            <div className="panel-skills-grid">{SKILL_CATEGORIES.map(category => <article key={category.title} className="panel-skill-group">
              <h4>{category.title}</h4><Tags items={category.skills} />
            </article>)}</div>
          </section>

          <section aria-labelledby="education-title">
            <h3 id="education-title" className="panel-section-label">Education</h3>
            <div className="panel-education">{EDUCATION.map(education => <article key={education.degree}>
              <span className="panel-meta">{education.period}</span>
              <h4>{education.degree}</h4>
              <span className="panel-school">{education.school}</span>
              <p>{education.details}</p>
            </article>)}</div>
          </section>
        </div>}

        {activeSector === 'projects' && <ProjectGallery projectFilter={projectFilter} onFilterChange={setProjectFilter} onSelectSector={onSelectSector} />}

        {activeSector === 'experience' && <div className="panel-section-stack">
          <p className="panel-section-lead">Professional career trajectory over 8+ years across enterprise full-stack development, mobile apps, and distributed systems:</p>
          <div className="panel-timeline">{EXPERIENCES.map(experience => <article key={experience.id} className="panel-experience">
            <span className="panel-meta">{experience.period}</span>
            <h3>{experience.role}</h3>
            <div className="experience-company"><strong>{experience.company}</strong><span>{experience.location}</span></div>
            <ul className="experience-highlights">{experience.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>
            {experience.projects && experience.projects.length > 0 && <section className="experience-projects" aria-label={`Key projects at ${experience.company}`}>
              <h4 className="panel-section-label">Key projects & applications</h4>
              {experience.projects.map(project => <article key={project.title}>
                <h5>{project.title}</h5><p>{project.description}</p>
                {project.tech && <Tags items={project.tech} />}
              </article>)}
            </section>}
            <Tags items={experience.skills} />
          </article>)}</div>
        </div>}

        {activeSector === 'contact' && <div className="panel-section-stack">
          <div className="panel-contact-intro">
            <span className="panel-availability"><span />Open to collaboration</span>
            <p>Available for engineering roles, technical architecture consultation, and high-impact digital experiences.</p>
          </div>

          <div className="panel-contact-channels">
            <div className="contact-channel">
              <Mail size={20} aria-hidden="true" />
              <div className="contact-channel-copy"><span className="panel-section-label">Email</span><a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a></div>
              <button onClick={handleCopyEmail} className="contact-copy" aria-label={copied ? 'Email copied' : 'Copy email address'} title={copied ? 'Copied' : 'Copy email'}>
                {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              </button>
            </div>
            <a className="contact-channel" href={PERSONAL_INFO.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Connect with Hector on LinkedIn (opens in a new tab)">
              <Linkedin size={20} aria-hidden="true" /><div className="contact-channel-copy"><span className="panel-section-label">LinkedIn</span><span>hectoradanmoraleslugo</span></div><ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="contact-channel" href={PERSONAL_INFO.github} target="_blank" rel="noopener noreferrer" aria-label="View Hector's GitHub (opens in a new tab)">
              <Github size={20} aria-hidden="true" /><div className="contact-channel-copy"><span className="panel-section-label">GitHub</span><span>github.com/HectorAdan</span></div><ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <span className="contact-copy-status" role="status">{copied ? 'Email address copied.' : copyError ? 'Unable to copy. Select the address or use the email link.' : ''}</span>
          </div>

          <form onSubmit={handleSendMessage} className="panel-contact-form">
            <div className="contact-form-heading"><label htmlFor="contact-message">Start a conversation</label><span className="panel-meta">Demo</span></div>
            <p id="contact-demo-note">This form previews the interaction. To reach me, use the email or LinkedIn link above.</p>
            <textarea id="contact-message" aria-describedby="contact-demo-note" value={contactMessage} onChange={event => setContactMessage(event.target.value)} placeholder="Your project idea, question, or invitation…" rows={4} />
            <button type="submit" disabled={isTransmitting || transmitted || !contactMessage.trim()} className="panel-submit">
              {isTransmitting ? 'Previewing…' : transmitted ? 'Preview complete' : 'Preview message'}<ArrowUpRight size={17} aria-hidden="true" />
            </button>
            <span className="contact-form-status" role="status">{transmitted ? 'Demo complete. No message was sent.' : ''}</span>
          </form>
        </div>}
      </div>

      <footer className="panel-footer">
        <button onClick={onClose}><ArrowLeft size={15} aria-hidden="true" />Return to core</button>
        <button className="panel-next" onClick={() => onSelectSector(nextSection)} aria-label={`Next section: ${SECTORS[nextSection].label}`}><span>Next / <strong>{SECTORS[nextSection].label}</strong></span><ArrowRight size={16} aria-hidden="true" /></button>
      </footer>
    </aside>
  );
}
