import { z } from 'zod';

// Strip HTML tags + control chars; collapse whitespace. Defends against raw
// <script> / attribute-based payloads being persisted even though React escapes
// them client-side (CSV exports, email templates, SSR contexts remain at risk).
function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const safeName = z
  .string()
  .max(200)
  .transform(sanitizeText)
  .pipe(z.string().min(1, 'Name is required').max(100));

const safeDescription = z
  .string()
  .max(1000)
  .transform(sanitizeText)
  .pipe(z.string().max(500))
  .optional();

export const habitSchema = z.object({
  name: safeName,
  description: safeDescription,
  icon: z.string().default('circle-check'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color').default('#555555'),
  category_id: z.string().uuid().nullable().optional(),
  frequency: z.object({
    type: z.enum(['daily', 'weekly', 'x_per_week', 'x_per_month']),
    days: z.array(z.number().min(0).max(6)).optional(),
    count: z.number().min(1).max(31).optional(),
  }),
  target_type: z.enum(['boolean', 'numeric', 'duration']).default('boolean'),
  target_value: z.number().min(1).default(1),
  target_unit: z.preprocess((val) => (val === '' ? null : val), z.string().max(20).nullable().optional()),
  reminder_time: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
  is_bad_habit: z.boolean().default(false),
  challenge_days: z.number().int().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.frequency.type === 'weekly' && (!data.frequency.days || data.frequency.days.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select at least one day for weekly habits',
      path: ['frequency', 'days'],
    });
  }
  if (
    (data.frequency.type === 'x_per_week' || data.frequency.type === 'x_per_month') &&
    !data.frequency.count
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Count is required',
      path: ['frequency', 'count'],
    });
  }
});

export type HabitFormValues = z.infer<typeof habitSchema>;

const safeCategoryName = z
  .string()
  .max(100)
  .transform(sanitizeText)
  .pipe(z.string().min(1).max(50));

export const categorySchema = z.object({
  name: safeCategoryName,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().default('folder'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
