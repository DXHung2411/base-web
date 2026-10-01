import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

interface SortableListProps<T extends { id: number }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ComponentChildren;
}

const move = <T,>(list: T[], from: number, to: number) => {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

/** Drag and drop reordering with native HTML5 events, plus up/down buttons for keyboard users. */
export function SortableList<T extends { id: number }>({ items, onReorder, renderItem }: SortableListProps<T>) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const drop = (targetId: number) => {
    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from >= 0 && to >= 0 && from !== to) onReorder(move(items, from, to));
  };

  return (
    <ul class="space-y-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={(event) => {
            setDragId(item.id);
            event.dataTransfer?.setData('text/plain', String(item.id));
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (overId !== item.id) setOverId(item.id);
          }}
          onDrop={(event) => {
            event.preventDefault();
            drop(item.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          class={`flex items-center gap-2 rounded-md border bg-white px-2 py-2 ${
            overId === item.id && dragId !== item.id ? 'border-stone-900' : 'border-stone-200'
          } ${dragId === item.id ? 'opacity-40' : ''}`}
        >
          <span class="cursor-grab px-1 text-stone-400" aria-hidden="true" title="Kéo để sắp xếp">
            <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor">
              <circle cx="4" cy="4" r="1.5" /><circle cx="10" cy="4" r="1.5" />
              <circle cx="4" cy="9" r="1.5" /><circle cx="10" cy="9" r="1.5" />
              <circle cx="4" cy="14" r="1.5" /><circle cx="10" cy="14" r="1.5" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">{renderItem(item, index)}</div>
          <div class="flex flex-col">
            <button
              type="button"
              class="px-1 text-stone-500 hover:text-stone-900 disabled:opacity-30"
              disabled={index === 0}
              aria-label="Chuyển lên"
              onClick={() => onReorder(move(items, index, index - 1))}
            >▲</button>
            <button
              type="button"
              class="px-1 text-stone-500 hover:text-stone-900 disabled:opacity-30"
              disabled={index === items.length - 1}
              aria-label="Chuyển xuống"
              onClick={() => onReorder(move(items, index, index + 1))}
            >▼</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
