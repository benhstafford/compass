import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function toDb(task, userId) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    project: task.project,
    provenance: task.provenance,
    career_alignment: task.careerAlignment,
    leverage: task.leverage,
    effort: task.effort,
    due_date: task.dueDate,
    completed: task.completed,
    completed_at: task.completedAt,
    created_at: task.createdAt,
    scored: task.scored,
  };
}

export function fromDb(row) {
  return {
    id: row.id,
    title: row.title,
    project: row.project,
    provenance: row.provenance,
    careerAlignment: row.career_alignment,
    leverage: row.leverage,
    effort: row.effort,
    dueDate: row.due_date,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    scored: row.scored,
  };
}
