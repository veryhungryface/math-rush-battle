'use client';

import dynamic from 'next/dynamic';
import {
  BookOpen,
  Box,
  Camera,
  ChevronDown,
  Circle,
  Download,
  Eye,
  Focus,
  Grid3X3,
  Heart,
  Image,
  Info,
  Layers,
  Microscope,
  Move3D,
  Plus,
  RotateCcw,
  Scissors,
  Settings,
  Star
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { cellModels, type CellModel, type CellModelId, type Organelle } from './cell-data';
import styles from './cell-architecture-studio.module.css';

const Viewer3D = dynamic(() => import('./Viewer3D'), {
  ssr: false,
  loading: () => <div className={styles.viewerLoading}>Preparing 3D model</div>
});

type ViewerHandle = {
  getCanvas: () => HTMLCanvasElement | null;
};

function getSelectedPart(cell: CellModel, partId: string | null) {
  return cell.organelles.find((part) => part.id === partId) ?? null;
}

function triggerDownload(filename: string, href: string) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function downloadJson(cell: CellModel, selectedPart: Organelle | null) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          source: 'Cell Architecture Studio',
          cell,
          selectedPart
        },
        null,
        2
      )
    ],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  triggerDownload(`${cell.id}-cell-architecture.json`, url);
  URL.revokeObjectURL(url);
}

function ControlButton({
  active,
  children,
  disabled = false,
  label,
  onClick
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`${styles.controlButton} ${active ? styles.controlButtonActive : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function TopNavItem({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button className={styles.topNavItem} type="button">
      {icon}
      <span>{children}</span>
    </button>
  );
}

export default function CellArchitectureStudioClient() {
  const [selectedCellId, setSelectedCellId] = useState<CellModelId>('liver');
  const [selectedPartId, setSelectedPartId] = useState<string | null>('hepatocytes');
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [isolateMode, setIsolateMode] = useState(false);
  const [crossSection, setCrossSection] = useState(false);
  const [microscopeMode, setMicroscopeMode] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const viewerRef = useRef<ViewerHandle | null>(null);

  const selectedCell = useMemo(
    () => cellModels.find((cell) => cell.id === selectedCellId) ?? cellModels[0],
    [selectedCellId]
  );
  const selectedPart = getSelectedPart(selectedCell, hoveredPartId ?? selectedPartId);
  const compareCell = cellModels.find((cell) => cell.id === 'animal-cell') ?? cellModels[1] ?? selectedCell;
  const partPanelTitle =
    selectedCell.id === 'liver' ? 'Structures' : selectedCell.id === 'iphone-test' ? 'Parts' : 'Organelles';
  const detailPanelTitle =
    selectedCell.id === 'liver'
      ? 'Structure Details'
      : selectedCell.id === 'iphone-test'
        ? 'Model Details'
        : 'Organelle Details';

  function selectCell(cellId: CellModelId) {
    const nextCell = cellModels.find((cell) => cell.id === cellId) ?? cellModels[0];
    setSelectedCellId(cellId);
    setSelectedPartId(nextCell.organelles[1]?.id ?? nextCell.organelles[0]?.id ?? null);
    setHoveredPartId(null);
    setResetSignal((value) => value + 1);
  }

  function captureScreenshot() {
    const canvas = viewerRef.current?.getCanvas();
    if (!canvas) {
      return;
    }
    triggerDownload(`${selectedCell.id}-viewer.png`, canvas.toDataURL('image/png'));
  }

  return (
    <main className={styles.appShell}>
      <header className={styles.topBar}>
        <div className={styles.brandCluster}>
          <div className={styles.brandMark}>
            <span />
          </div>
          <div>
            <h1>Cell Architecture Studio</h1>
            <p>Explore life at the microscopic level</p>
          </div>
        </div>

        <nav className={styles.topNav} aria-label="Studio navigation">
          <TopNavItem icon={<Grid3X3 size={17} aria-hidden="true" />}>Gallery</TopNavItem>
          <TopNavItem icon={<Layers size={17} aria-hidden="true" />}>Library</TopNavItem>
          <TopNavItem icon={<BookOpen size={17} aria-hidden="true" />}>Notebooks</TopNavItem>
          <TopNavItem icon={<Settings size={17} aria-hidden="true" />}>Settings</TopNavItem>
          <button className={styles.profileButton} type="button" aria-label="Profile">
            <span />
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </nav>
      </header>

      <section className={styles.studioGrid}>
        <aside className={styles.leftRail}>
          <section className={styles.sidePanel}>
            <div className={styles.panelTitle}>
              <span>Contents</span>
              <ChevronDown size={14} aria-hidden="true" />
            </div>
            <div className={styles.cellList}>
              {cellModels.map((cell) => (
                <button
                  className={`${styles.cellRow} ${cell.id === selectedCell.id ? styles.cellRowActive : ''}`}
                  key={cell.id}
                  onClick={() => selectCell(cell.id)}
                  style={{ '--cell-accent': cell.accent } as React.CSSProperties}
                  type="button"
                >
                  <span className={styles.cellThumb}>
                    <span />
                  </span>
                  <span className={styles.cellRowText}>
                    <strong>{cell.name}</strong>
                    <small>{cell.category}</small>
                  </span>
                  {cell.id === selectedCell.id ? <Star size={14} aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.sidePanel}>
            <div className={styles.panelTitle}>
              <span>{partPanelTitle}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </div>
            <div className={styles.organelleList}>
              {selectedCell.organelles.map((part) => (
                <button
                  className={`${styles.organelleRow} ${part.id === selectedPartId ? styles.organelleRowActive : ''}`}
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id)}
                  onPointerEnter={() => setHoveredPartId(part.id)}
                  onPointerLeave={() => setHoveredPartId(null)}
                  style={{ '--cell-accent': part.color } as React.CSSProperties}
                  type="button"
                >
                  <Circle size={10} fill="currentColor" aria-hidden="true" />
                  <span>{part.name}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className={styles.mainColumn}>
          <section className={styles.viewerCard}>
            <div className={styles.viewerHeading}>
              <h2>{selectedCell.name}</h2>
              <p>{selectedCell.category}</p>
            </div>

            <div className={styles.tipNote}>
              <span>Tip</span>
              <p>Drag to rotate, scroll to zoom, and select a part to inspect.</p>
            </div>

            <div className={styles.viewModePanel}>
              <span>View Mode</span>
              <div className={styles.viewModeButtons}>
                <button type="button" title="Solid view" aria-label="Solid view">
                  <Box size={18} aria-hidden="true" />
                </button>
                <button
                  className={crossSection ? styles.viewModeActive : ''}
                  onClick={() => setCrossSection((value) => !value)}
                  type="button"
                  title="Cross section"
                  aria-label="Cross section"
                >
                  <Layers size={18} aria-hidden="true" />
                </button>
                <button
                  className={microscopeMode ? styles.viewModeActive : ''}
                  onClick={() => setMicroscopeMode((value) => !value)}
                  type="button"
                  title="Microscope tone"
                  aria-label="Microscope tone"
                >
                  <Eye size={18} aria-hidden="true" />
                </button>
              </div>
              <label className={styles.switchRow}>
                <span>Cross-Section</span>
                <input
                  checked={crossSection}
                  onChange={() => setCrossSection((value) => !value)}
                  type="checkbox"
                />
                <i />
              </label>
            </div>

            <div className={styles.viewerStage}>
              <Viewer3D
                ref={viewerRef}
                cell={selectedCell}
                crossSection={crossSection}
                highlightedPartId={hoveredPartId ?? selectedPartId}
                isolateMode={isolateMode}
                microscopeMode={microscopeMode}
                onHoverPart={setHoveredPartId}
                onSelectPart={setSelectedPartId}
                resetSignal={resetSignal}
                selectedPartId={selectedPartId}
              />
            </div>

            <div className={styles.viewerActions}>
              <div className={styles.viewerActionGroup}>
                <ControlButton label="Rotate" onClick={() => setResetSignal((value) => value + 1)}>
                  <Move3D size={15} aria-hidden="true" />
                </ControlButton>
                <ControlButton
                  active={isolateMode}
                  disabled={!selectedPart}
                  label="Isolate"
                  onClick={() => setIsolateMode((value) => !value)}
                >
                  <Focus size={15} aria-hidden="true" />
                </ControlButton>
                <ControlButton
                  active={isolateMode}
                  disabled={!selectedPart}
                  label="Hide Others"
                  onClick={() => setIsolateMode((value) => !value)}
                >
                  <Eye size={15} aria-hidden="true" />
                </ControlButton>
                <ControlButton label="Reset View" onClick={() => setResetSignal((value) => value + 1)}>
                  <RotateCcw size={15} aria-hidden="true" />
                </ControlButton>
              </div>

              <div className={styles.viewerActionGroup}>
                <ControlButton label="Screenshot" onClick={captureScreenshot}>
                  <Camera size={15} aria-hidden="true" />
                </ControlButton>
                <ControlButton label="3D Export" onClick={() => downloadJson(selectedCell, selectedPart)}>
                  <Download size={15} aria-hidden="true" />
                </ControlButton>
              </div>
            </div>
          </section>

          <section className={styles.learningGrid}>
            <article className={styles.learningPanel}>
              <div className={styles.learningTitle}>
                <span>Microscope View</span>
                <Info size={13} aria-hidden="true" />
              </div>
              <div className={styles.slideStrip}>
                {['Light Microscope', 'Stained Selection', 'Electron Microscope'].map((label, index) => (
                  <button className={styles.slideCard} key={label} type="button">
                    <span className={styles[`slideArt${index + 1}`]} />
                    <strong>{label}</strong>
                  </button>
                ))}
                <button className={styles.addSlideCard} type="button">
                  <Plus size={18} aria-hidden="true" />
                  <span>Add Image</span>
                </button>
              </div>
            </article>

            <article className={styles.learningPanel}>
              <div className={styles.learningTitle}>
                <span>Compare Cells</span>
                <Info size={13} aria-hidden="true" />
              </div>
              <div className={styles.compareBox}>
                <div className={styles.compareCell} style={{ '--cell-accent': selectedCell.accent } as React.CSSProperties}>
                  <span className={styles.miniCell} />
                  <strong>{selectedCell.name}</strong>
                  <small>Now in view</small>
                </div>
                <b>vs</b>
                <div className={styles.compareCell} style={{ '--cell-accent': compareCell.accent } as React.CSSProperties}>
                  <span className={styles.miniCell} />
                  <strong>{compareCell.name}</strong>
                  <small>{compareCell.category}</small>
                </div>
              </div>
              <button className={styles.comparisonButton} type="button">
                Open Comparison View
              </button>
            </article>
          </section>
        </section>

        <aside className={styles.rightRail}>
          <section className={styles.detailPanel}>
            <div className={styles.detailTitle}>
              <span>{detailPanelTitle}</span>
              <Heart size={15} fill="currentColor" aria-hidden="true" />
            </div>
            <div className={styles.detailHero}>
              <span style={{ '--cell-accent': selectedPart?.color ?? selectedCell.accent } as React.CSSProperties} />
              <div>
                <h3>{selectedPart?.name ?? selectedCell.name}</h3>
                <p>{selectedPart?.koreanName ?? selectedCell.koreanName}</p>
              </div>
            </div>
            <dl className={styles.detailFacts}>
              <div>
                <dt>Size</dt>
                <dd>{selectedCell.metrics.scale}</dd>
              </div>
              <div>
                <dt>Function</dt>
                <dd>{selectedPart ? selectedPart.function : selectedCell.summary}</dd>
              </div>
              <div>
                <dt>Visible in 3D</dt>
                <dd>Yes</dd>
              </div>
              <div>
                <dt>Label</dt>
                <dd>
                  <span className={styles.inlineSwitch} />
                </dd>
              </div>
            </dl>
          </section>

          <section className={styles.detailPanel}>
            <div className={styles.detailTitle}>
              <span>Biological Notes</span>
            </div>
            <p className={styles.noteText}>{selectedPart?.biologicalNotes ?? selectedCell.biologicalNotes[0]}</p>
            <p className={styles.factText}>Fun fact: well-labeled structures help students connect shape with function.</p>
          </section>

          <section className={styles.detailPanel}>
            <div className={styles.detailTitle}>
              <span>Where It Occurs</span>
            </div>
            <div className={styles.occursArt}>
              <Image size={22} aria-hidden="true" />
              <span />
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
