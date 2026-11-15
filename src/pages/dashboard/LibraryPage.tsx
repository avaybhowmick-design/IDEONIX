import React, { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Search, Trash2, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { LibraryCategory, LibraryItem } from '../../types/ideonix';
import { filterLibraryItems } from '../../utils/creatorHelpers';
import {
  getListItemVariants,
  getModalBackdropVariants,
  getModalDialogVariants,
  MOTION_EASING,
  useMotionSettings,
} from '../../config/motion';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
} from '../../components/ui/GlassPrimitives';

const CATEGORIES: Array<{ id: LibraryCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'autopilot', label: 'Autopilot' },
  { id: 'idea', label: 'Ideas' },
  { id: 'script', label: 'Scripts' },
  { id: 'caption', label: 'Captions' },
  { id: 'repurpose', label: 'Repurposed' },
  { id: 'campaign', label: 'Campaigns' },
  { id: 'viral', label: 'Viral Reports' },
  { id: 'doctor', label: 'Doctor Reports' },
  { id: 'assistant', label: 'Assistant Notes' },
];

export function LibraryPage() {
  const { library, workspaceLoading, saveLibraryItem, deleteLibraryItem } = useWorkspace();
  const { durations, tabTransition } = useMotionSettings();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<LibraryCategory | 'all'>('all');
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => filterLibraryItems(library, search, category),
    [library, search, category]
  );

  const openEditor = (item: LibraryItem) => {
    setSelected(item);
    setEditTitle(item.title);
    setEditSummary(item.summary);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    try {
      const updated = await saveLibraryItem({
        id: selected.id,
        category: selected.category,
        title: editTitle.trim() || selected.title,
        summary: editSummary,
        platform: selected.platform,
        tags: selected.tags,
        payload: selected.payload,
      });
      setSelected(updated);
    } finally {
      setSaving(false);
    }
  };

  const listVariants = getListItemVariants(durations.base);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">My Library</h1>
        <p className="mt-1 text-sm text-neutral-300">
          Search, filter, edit, copy, or remove your saved ideas, scripts, captions, campaigns, and reports.
        </p>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <input
            aria-label="Search library items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, platform, or tag..."
            className={`${inputClassName} pl-10`}
          />
        </div>

        <LayoutGroup id="library-category-tabs">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                  className={`glass relative min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'text-white' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="library-category-pill"
                      transition={tabTransition}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-xl border border-white/35 bg-white/15"
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {workspaceLoading ? (
        <ResultsSkeleton variant="cards" count={4} />
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-white">No matching library items</p>
          <p className="mt-1 text-xs text-neutral-400">
            {library.length === 0
              ? 'Save outputs from any studio tool and they will appear here.'
              : 'Try clearing your search or switching category filters.'}
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                variants={listVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full"
              >
                <GlassCard index={idx} className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
                      <span>
                        {item.category} · {item.platform}
                      </span>
                      <span className="font-mono tabular-nums">{item.updatedAt.slice(0, 10)}</span>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-white">{item.title}</h2>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-300">
                      {item.summary}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2">
                      <GlassButton onClick={() => openEditor(item)} className="px-3 py-1.5 text-xs">
                        Inspect / Edit
                      </GlassButton>
                      <CopyTextButton
                        text={`${item.title}\n\n${item.summary}\n\n${JSON.stringify(item.payload, null, 2)}`}
                      />
                    </div>
                    <motion.button
                      type="button"
                      aria-label={`Delete "${item.title}"`}
                      onClick={() => deleteLibraryItem(item.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail / Edit Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            variants={getModalBackdropVariants(durations.base)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelected(null);
            }}
          >
            <motion.div
              variants={getModalDialogVariants(durations.base)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-2xl"
            >
              <GlassCard hoverLift={false} className="max-h-[88dvh] w-full overflow-y-auto p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs text-neutral-300">
                      {selected.category} · {selected.platform}
                    </p>
                    <h2 className="text-lg font-semibold text-white">Edit Library Entry</h2>
                  </div>
                  <motion.button
                    type="button"
                    aria-label="Close editor"
                    onClick={() => setSelected(null)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                    className="glass inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-300 hover:brightness-110 hover:text-white"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </motion.button>
                </div>

                <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="lib-edit-title" className={labelClassName}>
                      Title
                    </label>
                    <input
                      id="lib-edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lib-edit-summary" className={labelClassName}>
                      Summary
                    </label>
                    <textarea
                      id="lib-edit-summary"
                      rows={3}
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <p className={labelClassName}>Stored Payload Snapshot</p>
                    <pre className="glass max-h-60 overflow-auto rounded-xl p-3 text-xs text-neutral-300">
                      {JSON.stringify(selected.payload, null, 2)}
                    </pre>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <GlassButton onClick={() => setSelected(null)}>Close</GlassButton>
                    <PrimaryButton type="submit" loading={saving}>
                      Save Changes
                    </PrimaryButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
