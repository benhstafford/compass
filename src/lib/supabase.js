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

export function fromDbProfile(row) {
  return {
    displayName: row.display_name || '',
    avatarUrl: row.avatar_url || '',
    workNorthStar: row.work_north_star || '',
    lifeVision: row.life_vision || '',
    currentFocus: row.current_focus || '',
    defaultMode: row.default_mode || 'work',
    customProjects: row.custom_projects || { work: [], personal: [] },
  };
}

export function toDbProfile(profile, userId) {
  return {
    user_id: userId,
    display_name: profile.displayName || null,
    avatar_url: profile.avatarUrl || null,
    work_north_star: profile.workNorthStar || null,
    life_vision: profile.lifeVision || null,
    current_focus: profile.currentFocus || null,
    default_mode: profile.defaultMode || 'work',
    custom_projects: profile.customProjects || { work: [], personal: [] },
  };
}
