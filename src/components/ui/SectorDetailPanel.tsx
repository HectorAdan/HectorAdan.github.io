import { useState } from 'react';
import { X, ArrowUpRight, Copy, Check, Mail, Linkedin, Github, MapPin, Calendar, Award, Code2, Briefcase, GraduationCap, Sparkles, Layers, Smartphone, Globe, Layers2 } from 'lucide-react';
import { SectorId } from '../../types/portfolio';
import { SECTORS, PERSONAL_INFO, PROJECTS, EXPERIENCES, EDUCATION, SKILL_CATEGORIES } from '../../data/portfolioData';

interface SectorDetailPanelProps {
  activeSector: SectorId;
  onClose: () => void;
  onSelectSector: (sector: SectorId) => void;
}

export function SectorDetailPanel({ activeSector, onClose, onSelectSector }: SectorDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitted, setTransmitted] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  if (activeSector === 'home') return null;

  const currentSectorConfig = SECTORS[activeSector];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PERSONAL_INFO.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      setTransmitted(true);
      setTimeout(() => {
        setTransmitted(false);
        setContactMessage('');
      }, 4000);
    }, 1200);
  };

  // Filter projects by company if selected
  const filteredProjects = PROJECTS.filter((proj) => {
    if (projectFilter === 'ALL') return true;
    if (projectFilter === 'WestonDEV') return proj.company === 'WestonDEV';
    if (projectFilter === 'Kioscomático') return proj.company === 'Kioscomático';
    if (projectFilter === 'Colima Impulsa') return proj.company === 'Colima Impulsa';
    if (projectFilter === 'Research') return proj.company !== 'WestonDEV' && proj.company !== 'Kioscomático' && proj.company !== 'Colima Impulsa';
    return true;
  });

  return (
    <aside
      className="fixed inset-y-0 right-0 w-full md:w-[580px] lg:w-[650px] z-30 flex flex-col bg-black/90 backdrop-blur-2xl border-l border-cyan-500/30 text-white shadow-[-10px_0_40px_rgba(0,0,0,0.85)] animate-slide-left pointer-events-auto"
      role="dialog"
      aria-labelledby="sector-panel-title"
      aria-modal="true"
    >
      {/* Top Telemetry Header */}
      <div className="px-6 py-5 border-b border-cyan-900/40 flex items-center justify-between bg-black/50">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
              <span>{currentSectorConfig.code}</span>
              <span>//</span>
              <span className="text-gray-400">SECTOR ACTIVE</span>
            </div>
            <h2 id="sector-panel-title" className="text-xl font-bold tracking-tight text-white font-display">
              {currentSectorConfig.label}
            </h2>
          </div>
        </div>

        {/* Close Button / Return to Focal Core */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 hover:border-cyan-400 transition-all flex items-center gap-1.5 font-mono text-xs"
          aria-label="Close sector panel and return to central core (Esc)"
          title="Return to Core (Esc)"
        >
          <span className="hidden sm:inline">ESC / CLOSE</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sector Quick Switcher Tabs */}
      <div className="px-6 py-2 border-b border-cyan-950/60 bg-black/60 flex items-center gap-2 overflow-x-auto text-xs font-mono">
        {(['about', 'projects', 'experience', 'contact'] as SectorId[]).map((sec) => (
          <button
            key={sec}
            onClick={() => onSelectSector(sec)}
            className={`px-3 py-1 rounded transition-all whitespace-nowrap inline-flex items-center w-auto flex-shrink-0 ${
              activeSector === sec
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                : 'text-gray-400 hover:text-cyan-200 hover:bg-white/5'
            }`}
          >
            {SECTORS[sec].label}
          </button>
        ))}
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
        {/* ===================== ABOUT SECTOR ===================== */}
        {activeSector === 'about' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Engineering Philosophy & Profile
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                I am a Software Engineer and Senior Fullstack Developer with over 8 years of experience building high-performance web applications, scalable mobile architectures, and responsive spatial interfaces.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                My academic foundation includes a Master's Degree in Computer Science with research in Business Intelligence and Decision Support Systems. I bridge theoretical computing depth with modern, creative user experiences and emerging AI interfaces.
              </p>
            </div>

            {/* Technical Skills Breakdown */}
            <div>
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Technical Capabilities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SKILL_CATEGORIES.map((cat, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-black/40 border border-cyan-900/40">
                    <div className="font-semibold text-xs text-cyan-200 mb-2">{cat.title}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 text-[11px] font-mono text-cyan-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Credentials */}
            <div>
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Academic Matrix
              </h3>
              <div className="space-y-3">
                {EDUCATION.map((edu, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-black/40 border border-cyan-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm text-white">{edu.degree}</div>
                      <span className="font-mono text-xs text-cyan-400">{edu.period}</span>
                    </div>
                    <div className="text-xs text-cyan-300 mb-1.5">{edu.school}</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{edu.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== PROJECTS SECTOR ===================== */}
        {activeSector === 'projects' && (
          <div className="space-y-5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap pb-1 text-xs font-mono">
              <span className="text-gray-500 mr-1 hidden sm:inline flex-shrink-0">FILTER:</span>
              {[
                { label: 'ALL', id: 'ALL' },
                { label: 'WESTONDEV', id: 'WestonDEV' },
                { label: 'KIOSCOMÁTICO', id: 'Kioscomático' },
                { label: 'COLIMA IMPULSA', id: 'Colima Impulsa' },
                { label: 'RESEARCH & LABS', id: 'Research' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setProjectFilter(pill.id)}
                  className={`px-2.5 py-1 rounded transition-all whitespace-nowrap inline-flex items-center w-auto flex-shrink-0 ${
                    projectFilter === pill.id
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-black/60 border border-cyan-900/50 text-gray-400 hover:text-cyan-300'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <p className="text-gray-300 text-xs">
              Showing {filteredProjects.length} applications and engineering solutions:
            </p>

            <div className="space-y-4">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl bg-black/60 border border-cyan-900/50 hover:border-cyan-500/60 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {proj.company && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-700/50 text-cyan-300 font-mono text-[10px] font-bold">
                            {proj.company}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-gray-400">
                          {proj.category} • {proj.year}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {proj.title}
                      </h4>
                    </div>
                    {proj.featured && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono text-[10px]">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <p className="text-gray-300 text-xs leading-relaxed mb-3">
                    {proj.description}
                  </p>

                  {proj.metrics && (
                    <div className="mb-3 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-800/40 font-mono text-xs text-cyan-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{proj.metrics}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {proj.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-black/80 border border-gray-800 text-[10px] font-mono text-gray-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== EXPERIENCE SECTOR ===================== */}
        {activeSector === 'experience' && (
          <div className="space-y-6">
            <p className="text-gray-300 text-sm">
              Professional career trajectory over 8+ years across enterprise full-stack development, mobile apps, and distributed systems:
            </p>

            <div className="relative pl-4 border-l-2 border-cyan-500/30 space-y-8">
              {EXPERIENCES.map((exp) => (
                <div key={exp.id} className="relative">
                  {/* Glowing Node Dot on Timeline */}
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-black" />

                  <div className="p-5 rounded-xl bg-black/60 border border-cyan-900/50 hover:border-cyan-500/40 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                      <h4 className="text-base font-bold text-white">{exp.role}</h4>
                      <span className="font-mono text-xs text-cyan-400 flex items-center gap-1 mt-0.5 sm:mt-0">
                        <Calendar className="w-3 h-3" />
                        {exp.period}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{exp.company}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 font-normal">{exp.location}</span>
                    </div>

                    {/* Highlights list */}
                    <ul className="space-y-1.5 mb-4 text-xs text-gray-300">
                      {exp.highlights.map((h, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-cyan-400 mt-0.5">›</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Dedicated Company Projects breakdown */}
                    {exp.projects && exp.projects.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-cyan-950/80">
                        <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <Layers2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Key Projects & Applications Engineered:</span>
                        </div>
                        <div className="space-y-2.5">
                          {exp.projects.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-3 rounded-lg bg-black/50 border border-cyan-900/40 hover:border-cyan-500/30 transition-all"
                            >
                              <div className="font-semibold text-xs text-white mb-1">
                                {p.title}
                              </div>
                              <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
                                {p.description}
                              </p>
                              {p.tech && (
                                <div className="flex flex-wrap gap-1">
                                  {p.tech.map((t, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-700/40 text-[9px] font-mono text-cyan-300"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills footer */}
                    <div className="flex flex-wrap gap-1.5 pt-3 mt-3 border-t border-cyan-950/60">
                      {exp.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-900/60 text-[10px] font-mono text-cyan-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== CONTACT SECTOR ===================== */}
        {activeSector === 'contact' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
              <h3 className="text-sm font-semibold text-cyan-200 mb-1">Direct Neural Transmission</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Available for engineering roles, technical architecture consultation, and high-impact digital experiences.
              </p>
            </div>

            {/* Contact Channels */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-lg bg-black/60 border border-cyan-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-cyan-950/60 text-cyan-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400">EMAIL PROTOCOL</div>
                    <div className="font-mono text-xs text-white">{PERSONAL_INFO.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 font-mono text-xs flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-black/60 border border-cyan-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-cyan-950/60 text-cyan-400">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400">LINKEDIN LINK</div>
                    <div className="font-mono text-xs text-white">hectoradanmoraleslugo</div>
                  </div>
                </div>
                <a
                  href={PERSONAL_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 font-mono text-xs flex items-center gap-1 transition-all"
                >
                  <span>CONNECT</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3.5 rounded-lg bg-black/60 border border-cyan-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-cyan-950/60 text-cyan-400">
                    <Github className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400">GITHUB REPOSITORY</div>
                    <div className="font-mono text-xs text-white">github.com/HectorAdan</div>
                  </div>
                </div>
                <a
                  href={PERSONAL_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 font-mono text-xs flex items-center gap-1 transition-all"
                >
                  <span>SOURCE</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Quick Transmission Form */}
            <form onSubmit={handleSendMessage} className="space-y-3 pt-2">
              <label className="block text-xs font-mono text-cyan-400">
                <span>COMPOSE QUICK DISPATCH:</span>
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Enter your message, project idea, or invitation..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-black/80 border border-cyan-900/60 focus:border-cyan-400 text-white text-xs font-mono placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <button
                type="submit"
                disabled={isTransmitting || !contactMessage.trim()}
                className="w-full py-2.5 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
              >
                {isTransmitting ? 'TRANSMITTING VIA NEURAL CONDUIT...' : transmitted ? 'TRANSMISSION RECEIVED // THANK YOU!' : 'SEND DISPATCH TO HECTOR'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Return Navigation */}
      <div className="px-6 py-4 border-t border-cyan-950/60 bg-black/80 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-200 transition-colors flex items-center gap-1.5"
        >
          <span>← RETURN TO CORE VIEW</span>
        </button>
        <span className="text-[10px] font-mono text-gray-500">
          NODE: {currentSectorConfig.code}
        </span>
      </div>
    </aside>
  );
}
