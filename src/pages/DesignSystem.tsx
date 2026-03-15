import { useNavigate } from 'react-router';
import { Play, Upload, ChevronLeft, ChevronRight, X, Check, Dumbbell, ArrowLeft } from 'lucide-react';
import { Button, Card, IconButton } from '../shared/ui';
import styles from './DesignSystem.module.css';

const sections = ['Colors', 'Typography', 'Spacing', 'Radii', 'Button', 'IconButton', 'Card', 'Composition'];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </section>
  );
}

const colors = [
  { name: '--bg', value: '#0f0f12', label: 'Background' },
  { name: '--surface', value: '#1a1a22', label: 'Surface' },
  { name: '--surface-2', value: '#222230', label: 'Surface 2' },
  { name: '--lime', value: '#c8ff00', label: 'Lime (Primary)' },
  { name: '--lime-g', value: 'rgba(200,255,0,0.12)', label: 'Lime Ghost' },
  { name: '--violet', value: '#9966ff', label: 'Violet (Rest)' },
  { name: '--coral', value: '#ff5050', label: 'Coral (Danger)' },
  { name: '--white', value: '#f0f0f4', label: 'Text Primary' },
  { name: '--text-sec', value: '#6a6a80', label: 'Text Secondary' },
  { name: '--text-dim', value: '#3a3a48', label: 'Text Dim' },
  { name: '--border', value: '#28283a', label: 'Border' },
];

const spacings = [
  { name: '--space-xs', value: '4px' },
  { name: '--space-sm', value: '8px' },
  { name: '--space-md', value: '16px' },
  { name: '--space-lg', value: '24px' },
  { name: '--space-xl', value: '40px' },
];

const radii = [
  { name: '--radius-sm', value: '8px' },
  { name: '--radius-md', value: '14px' },
  { name: '--radius-lg', value: '18px' },
  { name: '--radius-xl', value: '28px' },
];

const fontSizes = [
  { name: '--text-xs', value: '10px', sample: 'UPPERCASE LABEL' },
  { name: '--text-sm', value: '13px', sample: 'Meta information' },
  { name: '--text-base', value: '15px', sample: 'Body text content' },
  { name: '--text-lg', value: '20px', sample: 'Section heading' },
  { name: '--text-xl', value: '28px', sample: 'Large value' },
  { name: '--text-2xl', value: '36px', sample: 'Display' },
  { name: '--text-hero', value: '48px', sample: 'Hero' },
];

export function DesignSystem() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Design System</div>
        {sections.map((s) => (
          <button key={s} className={styles.navLink} onClick={() => scrollTo(s.toLowerCase())}>
            {s}
          </button>
        ))}
        <div className={styles.navBack}>
          <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/')}>
            <ArrowLeft size={14} /> Back
          </Button>
        </div>
      </nav>

      <div className={styles.content}>
        {/* Colors */}
        <Section id="colors" title="Colors">
          <div className={styles.swatchGrid}>
            {colors.map((c) => (
              <div key={c.name} className={styles.swatch}>
                <div className={styles.swatchColor} style={{ background: c.value }} />
                <div className={styles.swatchInfo}>
                  <span className={styles.swatchName}>{c.label}</span>
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section id="typography" title="Typography">
          <div className={styles.col}>
            <div className={styles.label}>Unbounded (Display)</div>
            {fontSizes.map((f) => (
              <div key={f.name} className={styles.typeRow}>
                <span className={styles.typeToken}>{f.name} · {f.value}</span>
                <span className={styles.typeDisplay} style={{ fontSize: f.value }}>{f.sample}</span>
              </div>
            ))}
            <div className={styles.label}>Manrope (Body)</div>
            <div className={styles.typeBody} style={{ fontSize: 'var(--text-base)', color: 'var(--text-sec)', lineHeight: 1.6, maxWidth: 480 }}>
              Regular body text for descriptions and secondary content. Weights 400-800.
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section id="spacing" title="Spacing">
          <div className={styles.col}>
            {spacings.map((s) => (
              <div key={s.name} className={styles.spacingRow}>
                <span className={styles.spacingLabel}>{s.name} ({s.value})</span>
                <div className={styles.spacingBar} style={{ width: s.value }} />
              </div>
            ))}
          </div>
        </Section>

        {/* Radii */}
        <Section id="radii" title="Border Radius">
          <div className={styles.row}>
            {radii.map((r) => (
              <div key={r.name} className={styles.col} style={{ alignItems: 'center' }}>
                <div className={styles.radiusSample} style={{ borderRadius: r.value }}>
                  {r.value}
                  <span className={styles.radiusName}>{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section id="button" title="Button">
          <div className={styles.col}>
            <div className={styles.label}>Variants</div>
            <div className={styles.row}>
              <Button variant="primary"><Play size={16} fill="currentColor" /> Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="dashed"><Upload size={16} /> Dashed</Button>
            </div>
            <div className={styles.label}>Sizes</div>
            <div className={styles.row} style={{ alignItems: 'flex-end' }}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className={styles.label}>Full Width</div>
            <div style={{ maxWidth: 320 }}>
              <Button fullWidth><Play size={16} fill="currentColor" /> Start Workout</Button>
            </div>
          </div>
        </Section>

        {/* IconButton */}
        <Section id="iconbutton" title="IconButton">
          <div className={styles.col}>
            <div className={styles.label}>Sizes</div>
            <div className={styles.row}>
              <IconButton size="sm"><ChevronLeft size={16} /></IconButton>
              <IconButton size="md"><ChevronRight size={20} /></IconButton>
              <IconButton size="lg"><Play size={24} /></IconButton>
            </div>
            <div className={styles.label}>Danger</div>
            <div className={styles.row}>
              <IconButton size="lg" danger><X size={22} /></IconButton>
            </div>
          </div>
        </Section>

        {/* Card */}
        <Section id="card" title="Card">
          <div className={styles.col}>
            <div className={styles.label}>Default</div>
            <div className={styles.cardDemo}>
              <Card>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
                  Static Card
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-sec)' }}>
                  Non-interactive card for display
                </div>
              </Card>
            </div>

            <div className={styles.label}>Interactive</div>
            <div className={styles.cardDemo}>
              <Card interactive>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
                  Hover me
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-sec)' }}>
                  Lime border on hover
                </div>
              </Card>
            </div>

            <div className={styles.label}>Active</div>
            <div className={styles.cardDemo}>
              <Card interactive active>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
                  Active Card
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-sec)' }}>
                  Selected state with lime border + tinted bg
                </div>
              </Card>
            </div>

            <div className={styles.label}>Exercise Item</div>
            <div className={styles.cardDemo}>
              <Card interactive>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900, color: 'var(--text-dim)',
                  }}>1</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 4 }}>
                      Bench Press
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-sec)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      <span>4x12</span><span>60с</span><span>2-1-2</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className={styles.label}>Active Exercise</div>
            <div className={styles.cardDemo}>
              <Card interactive active>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--lime)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900, color: 'var(--bg)',
                  }}>2</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--lime)', marginBottom: 4 }}>
                      Squat
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-sec)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      <span>5x5</span><span>90с</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className={styles.label}>Done Exercise</div>
            <div className={styles.cardDemo}>
              <Card interactive>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--lime)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)',
                  }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 4 }}>
                      Warm-up
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-sec)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      1x10
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Section>

        {/* Composition */}
        <Section id="composition" title="Composition">
          <div className={styles.col}>
            <div className={styles.label}>Workout Card</div>
            <div className={styles.cardDemo}>
              <Card interactive>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 6 }}>
                  Full Body Workout
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-sec)', fontWeight: 600 }}>8 упр.</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: 'var(--text-dim)' }}>45'</span>
                </div>
              </Card>
            </div>

            <div className={styles.label}>Controls Row</div>
            <div className={styles.row} style={{ maxWidth: 500 }}>
              <IconButton size="lg"><ChevronLeft size={24} /></IconButton>
              <Button fullWidth style={{ height: 64, flex: 1 }}><Play size={28} fill="currentColor" /></Button>
              <IconButton size="lg"><ChevronRight size={24} /></IconButton>
              <IconButton size="lg" danger><X size={22} /></IconButton>
            </div>

            <div className={styles.label}>Empty State</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-xl)', opacity: 0.5 }}>
              <Dumbbell size={48} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-dim)' }}>
                Select a workout
              </span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
