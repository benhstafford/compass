export const SCORING_GUIDE = {
  careerAlignment: {
    label: 'Career alignment',
    description: 'How well this advances where you want your career to go.',
    levels: [
      { v: 1, l: 'Off-track or distracting' },
      { v: 2, l: 'Tangential to your goals' },
      { v: 3, l: 'Generally relevant' },
      { v: 4, l: 'Directly relevant' },
      { v: 5, l: 'Core to your trajectory' }
    ]
  },
  leverage: {
    label: 'Leverage',
    description: 'Visibility, influence, leadership opportunity. Will this be seen, valued, and demonstrate you driving outcomes?',
    levels: [
      { v: 1, l: 'Invisible, no influence' },
      { v: 2, l: 'Small audience, limited reach' },
      { v: 3, l: 'Moderate visibility within team' },
      { v: 4, l: 'Visible to leadership or cross-team' },
      { v: 5, l: 'High visibility AND clear leadership' }
    ]
  },
  effort: {
    label: 'Effort',
    description: 'Time and energy required. Subtracted from the score — high effort needs high payoff.',
    levels: [
      { v: 1, l: 'Trivial (under 30 min)' },
      { v: 2, l: 'Short (under 2 hours)' },
      { v: 3, l: 'Medium (half day)' },
      { v: 4, l: 'Substantial (1–3 days)' },
      { v: 5, l: 'Major (a week or more)' }
    ]
  }
};

export const URGENCY_LABELS = ['—', 'Background', 'Soon-ish', 'Approaching', 'Imminent', 'Now or overdue'];

export const PIE_COLORS = ['#c45b3f', '#2d5a3d', '#888581', '#d8956a', '#5a7a8c', '#a37862', '#7a8b6f', '#c8c4ba'];

export const calcUrgency = (dueDate) => {
  if (!dueDate) return 1;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const days = (due - now) / 86400000;
  if (days < 0) return 5;
  if (days <= 1) return 5;
  if (days <= 3) return 4;
  if (days <= 7) return 3;
  if (days <= 14) return 2;
  return 1;
};

export const calcScore = (t) =>
  t.careerAlignment + t.leverage + 3 * calcUrgency(t.dueDate) - t.effort;

export const scoreColors = (s) => {
  if (s >= 17) return { bg: '#c45b3f', fg: '#fafaf7' };
  if (s >= 12) return { bg: '#2c2c2a', fg: '#fafaf7' };
  if (s >= 7)  return { bg: '#888581', fg: '#fafaf7' };
  if (s >= 3)  return { bg: '#dcdad4', fg: '#5a5854' };
  return { bg: '#ececea', fg: '#a8a8a4' };
};

export const rankColor = (rank, total) => {
  const t = total <= 1 ? 0 : rank / (total - 1);
  const lightness = Math.round(22 + t * 48);
  const saturation = Math.round(65 - t * 30);
  return {
    bg: `hsl(142, ${saturation}%, ${lightness}%)`,
    fg: lightness < 48 ? '#fafaf7' : '#1a3a22'
  };
};

export const PERSONAL_SCORING_GUIDE = {
  careerAlignment: {
    label: 'Relationship impact',
    description: 'Does someone you care about notice or suffer if this doesn\'t get done?',
    levels: [
      { v: 1, l: 'Nobody affected but me' },
      { v: 2, l: 'Minor annoyance to others' },
      { v: 3, l: 'Noticeably affects household' },
      { v: 4, l: 'Directly affects someone I care about' },
      { v: 5, l: 'Significant relationship consequence if ignored' }
    ]
  },
  leverage: {
    label: 'Consequence of delay',
    description: 'What actually happens if this slips another week?',
    levels: [
      { v: 1, l: 'Nothing changes' },
      { v: 2, l: 'Minor inconvenience' },
      { v: 3, l: 'Noticeable problem' },
      { v: 4, l: 'Real cost or damage' },
      { v: 5, l: 'Serious consequence (safety, money, relationship)' }
    ]
  },
  effort: {
    label: 'Effort to start',
    description: 'How hard is it to initiate this task, not just complete it?',
    levels: [
      { v: 1, l: 'Trivial to begin' },
      { v: 2, l: 'Slight resistance' },
      { v: 3, l: 'Noticeable friction to start' },
      { v: 4, l: 'Significant initiation barrier' },
      { v: 5, l: 'Very hard to make yourself begin' }
    ]
  }
};

export const PROVENANCE_OPTIONS = ['Me', 'Manager', 'Peer', 'External'];

export const getNudge = (task) => {
  if (!task.scored) return null;
  const u = calcUrgency(task.dueDate);
  const { careerAlignment: ca, leverage: lv, effort: ef } = task;
  if (ef >= 4 && lv <= 2) return "Heavy lift, modest payoff. Who else could do this?";
  if (u >= 4 && ca <= 2 && lv <= 2) return "Is this actually urgent, or did someone else make it urgent for you?";
  if (ca <= 2 && lv <= 2 && u <= 2) return "Why is this on your list?";
  return null;
};
