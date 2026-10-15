import { useState } from 'react';
import { Check, AlertTriangle, Calendar, Plus } from 'lucide-react';
import type { ContactSummary } from '../data/contacts';

interface Task {
  id: string;
  title: string;
  due: string;
  done: boolean;
}

const seed: Task[] = [
  { id: 't1', title: 'Send revised quote', due: 'Due Friday', done: false },
  { id: 't2', title: 'Confirm sailing schedule', due: 'Due today', done: false },
  { id: 't3', title: 'Call to follow up on quote', due: 'Overdue', done: false },
  { id: 't4', title: 'Share company profile deck', due: 'Done', done: true },
];

export function TasksTab({ contact }: { contact: ContactSummary }) {
  const [tasks, setTasks] = useState<Task[]>(seed);
  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const open = tasks.filter((t) => !t.done).length;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Tasks</h2>
          <p className="text-[12px] text-faint">
            {open} open · for {contact.name}
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[14px] font-medium text-ink hover:bg-subtle">
          <Plus size={14} /> Add task
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {tasks.map((t) => {
          const w = t.due.toLowerCase();
          const urgent = !t.done && (w.includes('today') || w.includes('overdue'));
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3">
              <button
                onClick={() => toggle(t.id)}
                aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
                className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                  t.done ? 'border-ink bg-ink text-canvas' : 'border-line-strong text-transparent hover:border-ink'
                }`}
              >
                <Check size={13} strokeWidth={3} />
              </button>
              <span className={`min-w-0 flex-1 text-[14px] ${t.done ? 'text-muted line-through' : 'text-ink'}`}>
                {t.title}
              </span>
              <span
                className={`flex shrink-0 items-center gap-1 text-[12px] ${
                  t.done ? 'text-success' : urgent ? 'font-medium text-danger' : 'text-muted'
                }`}
              >
                {t.done ? <Check size={12} /> : urgent ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                {t.due}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
