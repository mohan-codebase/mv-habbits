export interface Quote {
  id: string;
  quote: string;
  author: string;
  category: 'motivation' | 'discipline' | 'mindset' | 'success' | 'resilience' | 'focus' | 'mindfulness';
  tags: string[];
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    id: 'q-1',
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
    category: 'discipline',
    tags: ['habits', 'excellence', 'consistency'],
  },
  {
    id: 'q-2',
    quote: 'Small daily improvements over time lead to stunning results.',
    author: 'Robin Sharma',
    category: 'motivation',
    tags: ['progress', 'habits', 'growth'],
  },
  {
    id: 'q-3',
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
    category: 'discipline',
    tags: ['systems', 'goals', 'atomic habits'],
  },
  {
    id: 'q-4',
    quote: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    category: 'motivation',
    tags: ['action', 'start', 'momentum'],
  },
  {
    id: 'q-5',
    quote: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
    category: 'discipline',
    tags: ['focus', 'self-control', 'goals'],
  },
  {
    id: 'q-6',
    quote: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    category: 'resilience',
    tags: ['persistence', 'patience', 'mindset'],
  },
  {
    id: 'q-7',
    quote: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
    category: 'success',
    tags: ['consistency', 'effort', 'routine'],
  },
  {
    id: 'q-8',
    quote: 'Don’t count the days, make the days count.',
    author: 'Muhammad Ali',
    category: 'motivation',
    tags: ['mindset', 'life', 'purpose'],
  },
  {
    id: 'q-9',
    quote: 'Focus on being productive instead of busy.',
    author: 'Tim Ferriss',
    category: 'focus',
    tags: ['productivity', 'efficiency', 'work'],
  },
  {
    id: 'q-10',
    quote: 'Action is the foundational key to all success.',
    author: 'Pablo Picasso',
    category: 'success',
    tags: ['action', 'execution', 'success'],
  },
  {
    id: 'q-11',
    quote: 'You don’t have to be great to start, but you have to start to be great.',
    author: 'Zig Ziglar',
    category: 'motivation',
    tags: ['begin', 'courage', 'growth'],
  },
  {
    id: 'q-12',
    quote: 'Mindfulness is a way of befriending ourselves and our experience.',
    author: 'Jon Kabat-Zinn',
    category: 'mindfulness',
    tags: ['calm', 'presence', 'peace'],
  },
  {
    id: 'q-13',
    quote: 'What we fear doing most is usually what we most need to do.',
    author: 'Tim Ferriss',
    category: 'resilience',
    tags: ['courage', 'overcoming-fear', 'mindset'],
  },
  {
    id: 'q-14',
    quote: 'Your future is created by what you do today, not tomorrow.',
    author: 'Robert Kiyosaki',
    category: 'motivation',
    tags: ['today', 'future', 'action'],
  },
  {
    id: 'q-15',
    quote: 'Motivation is what gets you started. Habit is what keeps you going.',
    author: 'Jim Ryun',
    category: 'discipline',
    tags: ['habits', 'consistency', 'routine'],
  },
  {
    id: 'q-16',
    quote: 'Believe you can and you’re halfway there.',
    author: 'Theodore Roosevelt',
    category: 'mindset',
    tags: ['belief', 'confidence', 'attitude'],
  },
  {
    id: 'q-17',
    quote: 'Energy flows where attention goes.',
    author: 'Tony Robbins',
    category: 'focus',
    tags: ['attention', 'clarity', 'energy'],
  },
  {
    id: 'q-18',
    quote: 'The only limit to our realization of tomorrow will be our doubts of today.',
    author: 'Franklin D. Roosevelt',
    category: 'mindset',
    tags: ['overcome', 'belief', 'future'],
  },
  {
    id: 'q-19',
    quote: 'Hardship often prepares an ordinary person for an extraordinary destiny.',
    author: 'C.S. Lewis',
    category: 'resilience',
    tags: ['strength', 'adversity', 'character'],
  },
  {
    id: 'q-20',
    quote: 'Do something today that your future self will thank you for.',
    author: 'Sean Patrick Flanery',
    category: 'motivation',
    tags: ['self-care', 'future', 'habits'],
  },
  {
    id: 'q-21',
    quote: 'The mind is everything. What you think you become.',
    author: 'Buddha',
    category: 'mindset',
    tags: ['thoughts', 'mindfulness', 'wisdom'],
  },
  {
    id: 'q-22',
    quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'resilience',
    tags: ['perseverance', 'courage', 'success'],
  },
  {
    id: 'q-23',
    quote: 'Either you run the day or the day runs you.',
    author: 'Jim Rohn',
    category: 'discipline',
    tags: ['time-management', 'control', 'discipline'],
  },
  {
    id: 'q-24',
    quote: 'The harder you work for something, the greater you’ll feel when you achieve it.',
    author: 'Anonymous',
    category: 'success',
    tags: ['hard-work', 'fulfillment', 'reward'],
  },
  {
    id: 'q-25',
    quote: 'Simplicity boils down to two steps: Identify the essential. Eliminate the rest.',
    author: 'Leo Babauta',
    category: 'focus',
    tags: ['minimalism', 'clarity', 'essentialism'],
  },
  {
    id: 'q-26',
    quote: 'Great things are done by a series of small things brought together.',
    author: 'Vincent Van Gogh',
    category: 'motivation',
    tags: ['craft', 'patience', 'habits'],
  },
  {
    id: 'q-27',
    quote: 'Be so good they can’t ignore you.',
    author: 'Steve Martin',
    category: 'success',
    tags: ['mastery', 'focus', 'excellence'],
  },
  {
    id: 'q-28',
    quote: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
    category: 'resilience',
    tags: ['optimism', 'problem-solving', 'mindset'],
  },
  {
    id: 'q-29',
    quote: 'Don’t watch the clock; do what it does. Keep going.',
    author: 'Sam Levenson',
    category: 'discipline',
    tags: ['persistence', 'momentum', 'time'],
  },
  {
    id: 'q-30',
    quote: 'Peace comes from within. Do not seek it without.',
    author: 'Buddha',
    category: 'mindfulness',
    tags: ['inner-peace', 'mindfulness', 'calm'],
  },
  {
    id: 'q-31',
    quote: 'If you want to live a happy life, tie it to a goal, not to people or things.',
    author: 'Albert Einstein',
    category: 'mindset',
    tags: ['purpose', 'goals', 'happiness'],
  },
  {
    id: 'q-32',
    quote: 'The best way to predict the future is to create it.',
    author: 'Peter Drucker',
    category: 'motivation',
    tags: ['leadership', 'action', 'creation'],
  },
  {
    id: 'q-33',
    quote: 'You cannot change your destination overnight, but you can change your direction overnight.',
    author: 'Jim Rohn',
    category: 'mindset',
    tags: ['direction', 'pivoting', 'choice'],
  },
  {
    id: 'q-34',
    quote: 'Mastering others is strength. Mastering yourself is true power.',
    author: 'Lao Tzu',
    category: 'discipline',
    tags: ['self-mastery', 'strength', 'discipline'],
  },
  {
    id: 'q-35',
    quote: 'It always seems impossible until it’s done.',
    author: 'Nelson Mandela',
    category: 'resilience',
    tags: ['perseverance', 'possibility', 'courage'],
  },
  {
    id: 'q-36',
    quote: 'Quality is not an act, it is a habit.',
    author: 'Aristotle',
    category: 'discipline',
    tags: ['quality', 'habits', 'standards'],
  },
  {
    id: 'q-37',
    quote: 'To live a pure unselfish life, one must count nothing as one’s own in the midst of abundance.',
    author: 'Buddha',
    category: 'mindfulness',
    tags: ['gratitude', 'mindfulness', 'clarity'],
  },
  {
    id: 'q-38',
    quote: 'Stay hungry, stay foolish.',
    author: 'Steve Jobs',
    category: 'motivation',
    tags: ['curiosity', 'ambition', 'innovation'],
  },
  {
    id: 'q-39',
    quote: 'The successful warrior is the average man, with laser-like focus.',
    author: 'Bruce Lee',
    category: 'focus',
    tags: ['focus', 'mastery', 'discipline'],
  },
  {
    id: 'q-40',
    quote: 'Courage doesn’t always roar. Sometimes courage is the quiet voice at the end of the day saying, "I will try again tomorrow."',
    author: 'Mary Anne Radmacher',
    category: 'resilience',
    tags: ['resilience', 'gently-trying', 'hope'],
  },
  {
    id: 'q-41',
    quote: 'What we achieve inwardly will change outer reality.',
    author: 'Plutarch',
    category: 'mindset',
    tags: ['inner-work', 'transformation', 'mindset'],
  },
  {
    id: 'q-42',
    quote: 'Turn your wounds into wisdom.',
    author: 'Oprah Winfrey',
    category: 'resilience',
    tags: ['wisdom', 'healing', 'growth'],
  },
  {
    id: 'q-43',
    quote: 'The unexamined life is not worth living.',
    author: 'Socrates',
    category: 'mindfulness',
    tags: ['reflection', 'awareness', 'wisdom'],
  },
  {
    id: 'q-44',
    quote: 'Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.',
    author: 'Paul J. Meyer',
    category: 'focus',
    tags: ['planning', 'productivity', 'commitment'],
  },
  {
    id: 'q-45',
    quote: 'Drop by drop is the water pot filled.',
    author: 'Buddha',
    category: 'discipline',
    tags: ['accumulation', 'patience', 'habits'],
  },
  {
    id: 'q-46',
    quote: 'Start where you are. Use what you have. Do what you can.',
    author: 'Arthur Ashe',
    category: 'motivation',
    tags: ['resourcefulness', 'starting', 'action'],
  },
  {
    id: 'q-47',
    quote: 'Fall seven times and stand up eight.',
    author: 'Japanese Proverb',
    category: 'resilience',
    tags: ['grit', 'perseverance', 'resilience'],
  },
  {
    id: 'q-48',
    quote: 'Focus is a matter of deciding what things you’re not going to do.',
    author: 'John Carmack',
    category: 'focus',
    tags: ['focus', 'trade-offs', 'discipline'],
  },
  {
    id: 'q-49',
    quote: 'Consistency is the true foundation of trust in yourself.',
    author: 'Unknown',
    category: 'discipline',
    tags: ['self-trust', 'consistency', 'confidence'],
  },
  {
    id: 'q-50',
    quote: 'Everything you’ve ever wanted is on the other side of fear.',
    author: 'George Addair',
    category: 'motivation',
    tags: ['courage', 'breakthrough', 'mindset'],
  },
  {
    id: 'q-51',
    quote: 'Light tomorrow with today!',
    author: 'Elizabeth Barrett Browning',
    category: 'motivation',
    tags: ['action', 'today', 'inspiration'],
  },
  {
    id: 'q-52',
    quote: 'There are no shortcuts to any place worth going.',
    author: 'Beverly Sills',
    category: 'success',
    tags: ['patience', 'journey', 'hard-work'],
  },
  {
    id: 'q-53',
    quote: 'Whenever you find yourself on the side of the majority, it is time to pause and reflect.',
    author: 'Mark Twain',
    category: 'mindfulness',
    tags: ['independent-thinking', 'reflection'],
  },
  {
    id: 'q-54',
    quote: 'Your passion is waiting for your courage to catch up.',
    author: 'Isabelle Lafleche',
    category: 'motivation',
    tags: ['courage', 'passion', 'purpose'],
  },
  {
    id: 'q-55',
    quote: 'Do not wait; the time will never be "just right." Start where you stand.',
    author: 'Napoleon Hill',
    category: 'discipline',
    tags: ['timing', 'action', 'initiative'],
  },
  {
    id: 'q-56',
    quote: 'The journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    category: 'motivation',
    tags: ['first-step', 'journey', 'progress'],
  },
  {
    id: 'q-57',
    quote: 'Be present in all things and thankful for all things.',
    author: 'Maya Angelou',
    category: 'mindfulness',
    tags: ['presence', 'gratitude', 'peace'],
  },
  {
    id: 'q-58',
    quote: 'Out of your vulnerabilities will come your strength.',
    author: 'Sigmund Freud',
    category: 'resilience',
    tags: ['vulnerability', 'strength', 'growth'],
  },
  {
    id: 'q-59',
    quote: 'When you change the way you look at things, the things you look at change.',
    author: 'Wayne Dyer',
    category: 'mindset',
    tags: ['perspective', 'mindset', 'shifts'],
  },
  {
    id: 'q-60',
    quote: 'Doubt kills more dreams than failure ever will.',
    author: 'Suzy Kassem',
    category: 'motivation',
    tags: ['self-doubt', 'belief', 'dreams'],
  },
];

// Helper to get formatted today string: YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Storage Keys
const STORAGE_ASSIGNMENTS_KEY = 'pm_quote_daily_assignments'; // { 'YYYY-MM-DD': 'q-ID' }
const STORAGE_SHOWN_IDS_KEY = 'pm_quote_shown_ids';           // ['q-1', 'q-2', ...]
const STORAGE_SAVED_IDS_KEY = 'pm_quote_saved_ids';           // ['q-3', 'q-5']
const STORAGE_LAST_SHOWN_MODAL_DATE = 'pm_quote_last_modal_date'; // 'YYYY-MM-DD'

/**
 * Deterministically retrieves the Quote of the Day.
 * Ensures quotes DO NOT repeat until all available quotes in MOTIVATIONAL_QUOTES have been shown.
 */
export function getTodayQuote(): Quote {
  if (typeof window === 'undefined') {
    return MOTIVATIONAL_QUOTES[0];
  }

  const todayStr = getTodayDateString();

  try {
    const rawAssignments = localStorage.getItem(STORAGE_ASSIGNMENTS_KEY);
    const assignments: Record<string, string> = rawAssignments ? JSON.parse(rawAssignments) : {};

    // 1. If today already has an assigned quote, return it!
    if (assignments[todayStr]) {
      const found = MOTIVATIONAL_QUOTES.find((q) => q.id === assignments[todayStr]);
      if (found) return found;
    }

    // 2. Otherwise pick a new non-repeating quote
    const rawShown = localStorage.getItem(STORAGE_SHOWN_IDS_KEY);
    let shownIds: string[] = rawShown ? JSON.parse(rawShown) : [];

    // Filter available quotes that haven't been shown yet
    let availableQuotes = MOTIVATIONAL_QUOTES.filter((q) => !shownIds.includes(q.id));

    // If all quotes have been shown, reset cycle to avoid running out
    if (availableQuotes.length === 0) {
      shownIds = [];
      availableQuotes = [...MOTIVATIONAL_QUOTES];
    }

    // Pick quote using date hash so it's consistent across renders on the same date
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash << 5) - hash + todayStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % availableQuotes.length;
    const selectedQuote = availableQuotes[index];

    // Persist assignment & update shown list
    assignments[todayStr] = selectedQuote.id;
    shownIds.push(selectedQuote.id);

    localStorage.setItem(STORAGE_ASSIGNMENTS_KEY, JSON.stringify(assignments));
    localStorage.setItem(STORAGE_SHOWN_IDS_KEY, JSON.stringify(shownIds));

    return selectedQuote;
  } catch (err) {
    console.error('Error selecting daily quote:', err);
    return MOTIVATIONAL_QUOTES[0];
  }
}

/**
 * Checks if the daily modal has already popped up today
 */
export function hasModalBeenShownToday(): boolean {
  if (typeof window === 'undefined') return false;
  const todayStr = getTodayDateString();
  const lastShown = localStorage.getItem(STORAGE_LAST_SHOWN_MODAL_DATE);
  return lastShown === todayStr;
}

/**
 * Marks that the modal was shown today
 */
export function markModalShownToday(): void {
  if (typeof window === 'undefined') return;
  const todayStr = getTodayDateString();
  localStorage.setItem(STORAGE_LAST_SHOWN_MODAL_DATE, todayStr);
}

/**
 * Get all saved quote IDs
 */
export function getSavedQuoteIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a specific quote is saved
 */
export function isQuoteSaved(id: string): boolean {
  return getSavedQuoteIds().includes(id);
}

/**
 * Toggle save/bookmark status for a quote
 */
export function toggleSaveQuote(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const saved = getSavedQuoteIds();
  let updated: string[];
  let isNowSaved = false;

  if (saved.includes(id)) {
    updated = saved.filter((sId) => sId !== id);
    isNowSaved = false;
  } else {
    updated = [...saved, id];
    isNowSaved = true;
  }

  localStorage.setItem(STORAGE_SAVED_IDS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mv-habits:quotes-updated'));
  return isNowSaved;
}

/**
 * Get full Quote objects for all saved quotes
 */
export function getSavedQuotes(): Quote[] {
  const savedIds = getSavedQuoteIds();
  return MOTIVATIONAL_QUOTES.filter((q) => savedIds.includes(q.id));
}

/**
 * Get past assigned quotes history
 */
export function getDailyQuoteHistory(): Array<{ date: string; quote: Quote }> {
  if (typeof window === 'undefined') return [];
  try {
    const rawAssignments = localStorage.getItem(STORAGE_ASSIGNMENTS_KEY);
    if (!rawAssignments) return [];
    const assignments: Record<string, string> = JSON.parse(rawAssignments);

    const history: Array<{ date: string; quote: Quote }> = [];
    const sortedDates = Object.keys(assignments).sort((a, b) => (a < b ? 1 : -1));

    for (const date of sortedDates) {
      const qId = assignments[date];
      const q = MOTIVATIONAL_QUOTES.find((item) => item.id === qId);
      if (q) {
        history.push({ date, quote: q });
      }
    }

    return history;
  } catch {
    return [];
  }
}
