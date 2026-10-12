import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { PROJECTS } from '../../data/portfolioData';
import { PROJECT_STORIES, type ProjectStory } from '../../data/projectStories';
import type { ProjectItem, SectorId } from '../../types/portfolio';
import { TechnologyTags } from './TechnologyTags';
import { soundManager } from '../../utils/soundEffects';
import './ProjectGallery.css';

const filters = [
  { label: 'All work', id: 'ALL' },
  { label: 'Personal projects', id: 'Personal project' },
  { label: 'WestonDEV', id: 'WestonDEV' },
  { label: 'Kioscomático', id: 'Kioscomático' },
  { label: 'Colima Impulsa', id: 'Colima Impulsa' },
  { label: 'Research & labs', id: 'Research' },
];
const stories = PROJECT_STORIES.flatMap(story => {
  const project = PROJECTS.find(item => item.id === story.projectId);
  return project ? [{ story, project }] : [];
});

interface ProjectGalleryProps {
  projectFilter: string;
  onFilterChange: (filter: string) => void;
  onSelectSector: (sector: SectorId) => void;
}

function ProjectWebsiteLink({ project }: { project: ProjectItem }) {
  if (!project.liveUrl) return null;
  return <a className="project-read-story project-live-link" href={project.liveUrl} target="_blank" rel="noopener noreferrer"
    aria-label={`Visit ${project.title} (opens in a new tab)`}>
    Visit website<ArrowUpRight size={15} aria-hidden="true" />
  </a>;
}

function CaseStudy({ story, project, onBack, onReadStory, onContact, titleRef }: {
  story: ProjectStory;
  project: ProjectItem;
  onBack: () => void;
  onReadStory: (id: string) => void;
  onContact: () => void;
  titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  return <article className="project-story" aria-labelledby={`story-title-${project.id}`}>
    <button className="story-back" onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Back to all projects</button>
    <header className="story-header">
      <span className="panel-section-label">Case study / {story.discipline}</span>
      <h3 id={`story-title-${project.id}`} ref={titleRef} tabIndex={-1}>{story.title}<span>.</span></h3>
      <p className="story-project-name">{project.title}</p>
      <div className="story-byline"><span>{project.company}</span><span>{project.year}</span></div>
      <ProjectWebsiteLink project={project} />
    </header>
    <dl className="story-facts">
      <div><dt>My focus</dt><dd>{story.focus}</dd></div>
      <div><dt>Platform</dt><dd>{story.platform}</dd></div>
    </dl>
    <div className="story-sections">
      <section aria-labelledby={`story-challenge-${project.id}`}>
        <h4 id={`story-challenge-${project.id}`}><span aria-hidden="true">01</span>The challenge</h4>
        <p>{story.challenge}</p>
      </section>
      <section aria-labelledby={`story-contribution-${project.id}`}>
        <h4 id={`story-contribution-${project.id}`}><span aria-hidden="true">02</span>My contribution</h4>
        <ul className="story-contributions">{story.contributions.map(contribution => <li key={contribution}>{contribution}</li>)}</ul>
      </section>
      <section aria-labelledby={`story-focus-${project.id}`}>
        <h4 id={`story-focus-${project.id}`}><span aria-hidden="true">03</span>Engineering focus</h4>
        <p>{story.engineeringFocus}</p>
      </section>
      {project.metrics && <section className="story-outcome" aria-labelledby={`story-outcome-${project.id}`}>
        <h4 id={`story-outcome-${project.id}`}><span aria-hidden="true">04</span>Outcome</h4>
        <p>{project.metrics}</p>
      </section>}
      <section aria-labelledby={`story-stack-${project.id}`}>
        <h4 id={`story-stack-${project.id}`} className="story-stack-heading">Technology stack</h4>
        <TechnologyTags items={project.tags} />
      </section>
    </div>
    <button className="story-contact" onClick={onContact}>Discuss a similar project<ArrowUpRight size={16} aria-hidden="true" /></button>
    <nav className="story-related" aria-label="More case studies">
      <span className="panel-section-label">Another perspective</span>
      {stories.filter(item => item.project.id !== project.id).map(item => <button key={item.project.id} onClick={() => onReadStory(item.project.id)} aria-label={`Read case study: ${item.story.title}`}>
        <span>{item.story.title}</span><ArrowRight size={16} aria-hidden="true" />
      </button>)}
    </nav>
  </article>;
}

export function ProjectGallery({ projectFilter, onFilterChange, onSelectSector }: ProjectGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const storyTitle = useRef<HTMLHeadingElement>(null);
  const returnTarget = useRef({ id: '', scrollTop: 0 });
  const selected = stories.find(item => item.project.id === selectedId);
  const filteredProjects = PROJECTS.filter(project => {
    if (projectFilter === 'ALL') return true;
    if (projectFilter === 'Research') return !['Personal project', 'WestonDEV', 'Kioscomático', 'Colima Impulsa'].includes(project.company ?? '');
    return project.company === projectFilter;
  });

  const openStory = (id: string, triggerId?: string) => {
    soundManager.playNeuralClick();
    if (!selectedId) returnTarget.current = { id: triggerId ?? '', scrollTop: root.current?.closest('.panel-content')?.scrollTop ?? 0 };
    setSelectedId(id);
  };

  // Preserve the gallery's scroll and keyboard position across reading views.
  useLayoutEffect(() => {
    const content = root.current?.closest('.panel-content');
    if (!content) return;
    if (selectedId) {
      content.scrollTop = 0;
      storyTitle.current?.focus({ preventScroll: true });
    } else if (returnTarget.current.id) {
      content.scrollTop = returnTarget.current.scrollTop;
      document.getElementById(returnTarget.current.id)?.focus({ preventScroll: true });
    }
  }, [selectedId]);

  return <div ref={root} className="project-gallery">
    {selected ? <CaseStudy story={selected.story} project={selected.project} titleRef={storyTitle} onBack={() => { soundManager.playClose(); setSelectedId(null); }} onReadStory={openStory} onContact={() => onSelectSector('contact')} /> : <div className="panel-section-stack">
      <section className="case-study-index" aria-labelledby="case-study-index-title">
        <div className="case-study-index-heading"><h3 id="case-study-index-title" className="panel-section-label">Selected case studies</h3><span>{String(stories.length).padStart(2, '0')} perspectives</span></div>
        <div className="case-study-links">{stories.map(({ story, project }, index) => <button key={project.id} id={`story-index-${project.id}`} onClick={event => openStory(project.id, event.currentTarget.id)} aria-label={`Read case study: ${story.title}`}>
          <span className="case-study-index-number" aria-hidden="true">0{index + 1}</span>
          <span className="case-study-link-copy"><strong>{story.title}</strong><span>{story.discipline}</span></span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>)}</div>
      </section>

      <div className="panel-project-controls">
        <div className="panel-filters" role="group" aria-label="Filter projects">
          {filters.map(filter => <button key={filter.id} onClick={() => { if (filter.id !== projectFilter) soundManager.playNeuralClick(); onFilterChange(filter.id); }} aria-pressed={projectFilter === filter.id}>{filter.label}</button>)}
        </div>
        <p className="panel-result-count" role="status">{String(filteredProjects.length).padStart(2, '0')} projects <span>/ Applications & engineering solutions</span></p>
      </div>
      <div className="panel-project-list">{filteredProjects.map((project, index) => <article key={project.id} className={`panel-project-card${project.featured ? ' is-featured' : ''}`}>
        <div className="project-card-topline"><span className="panel-meta">{project.company ?? 'Research & labs'}</span><span className="project-card-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
        <h3>{project.title}</h3>
        <div className="project-card-meta"><span>{project.category}</span><span>{project.year}</span></div>
        <p>{project.description}</p>
        {project.metrics && <div className="project-card-outcome"><span className="panel-section-label">Impact & contribution</span><p>{project.metrics}</p></div>}
        <TechnologyTags items={project.tags} />
        <div className="project-card-footer">
          {project.featured && <span className="project-featured">Featured work</span>}
          <ProjectWebsiteLink project={project} />
          {stories.some(item => item.project.id === project.id) && <button id={`story-card-${project.id}`} onClick={event => openStory(project.id, event.currentTarget.id)} className="project-read-story" aria-label={`Read case study for ${project.title}`}>Read case study<ArrowUpRight size={15} aria-hidden="true" /></button>}
        </div>
      </article>)}</div>
    </div>}
  </div>;
}
