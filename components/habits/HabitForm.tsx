'use client';

import React, { useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ban, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import IconPicker from '@/components/ui/IconPicker';
import Select from '@/components/ui/Select';
import { habitSchema, type HabitFormValues } from '@/lib/validations/habit';
import type { Habit, Category } from '@/types/habit';

interface HabitFormProps {
  habit?: Habit;
  categories: Category[];
  categoryError?: boolean;
  onRetryCategories?: () => void;
  onSuccess: (habit: Habit) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  'var(--accent-primary)', '#7b7b7b', '#707070', '#717171',
  '#a6a6a6', '#6a6a6a', '#939393', '#b0b0b0',
  '#898989', '#6f6f6f',
];

type FrequencyTab = 'daily' | 'weekly' | 'x_per_week' | 'x_per_month';
type TargetTab = 'boolean' | 'numeric' | 'duration';

const FREQUENCY_LABELS: Record<FrequencyTab, string> = {
  daily: 'Daily',
  weekly: 'Specific Days',
  x_per_week: 'Per Week',
  x_per_month: 'Per Month',
};

const TARGET_LABELS: Record<TargetTab, string> = {
  boolean: 'Check-off',
  numeric: 'Numeric',
  duration: 'Duration',
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return `rgba(var(--accent-primary-rgb),${alpha})`;
  const s = hex.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

interface SegmentedControlProps<T extends string> {
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}

function SegmentedControl<T extends string>({
  options,
  labels,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex bg-bg-tertiary rounded-md p-[3px] gap-0.5 flex-wrap">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-[7px] border-none text-[13px] cursor-pointer transition-all duration-150 shadow-none whitespace-nowrap ${active ? 'bg-bg-secondary text-text-primary font-semibold' : 'bg-transparent text-text-muted font-normal'}`}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}

export default function HabitForm({ habit, categories, categoryError, onRetryCategories, onSuccess, onClose }: HabitFormProps) {
  const isEdit = !!habit;
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema) as Resolver<HabitFormValues>,
    defaultValues: habit
      ? {
          name: habit.name,
          description: habit.description ?? undefined,
          icon: habit.icon,
          color: habit.color,
          category_id: habit.category_id ?? null,
          frequency: habit.frequency,
          target_type: habit.target_type,
          target_value: habit.target_value,
          target_unit: habit.target_unit ?? null,
          reminder_time: habit.reminder_time ?? null,
          is_bad_habit: habit.is_bad_habit ?? false,
        }
      : {
          name: '',
          icon: 'circle-check',
          color: '#555555',
          frequency: { type: 'daily' },
          target_type: 'boolean',
          target_value: 1,
          is_bad_habit: false,
        },
  });

  const watchColor = watch('color');
  const watchFrequencyType = watch('frequency.type');
  const watchFrequencyDays = watch('frequency.days') ?? [];
  const watchTargetType = watch('target_type');
  const watchDescription = watch('description') ?? '';
  const watchIsBadHabit = watch('is_bad_habit');

  const toggleDay = (day: number) => {
    const current = watchFrequencyDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    setValue('frequency.days', next);
  };

  const onSubmit = async (values: HabitFormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const url = isEdit ? `/api/habits/${habit.id}` : '/api/habits';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Something went wrong');
      }

      onSuccess(json.data);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'flex flex-col gap-1.5';
  const labelClass = 'text-[13px] font-medium text-text-secondary';

  return (
    <Modal
      isOpen
      onClose={loading ? () => {} : onClose}
      title={isEdit ? 'Edit Habit' : 'New Habit'}
      size="md"
      closeOnOutsideClick={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-5">

          {/* Habit Type — Good vs Bad */}
          <Controller
            name="is_bad_habit"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {([false, true] as const).map((isBad) => {
                  const active = field.value === isBad;
                  return (
                    <button
                      key={String(isBad)}
                      type="button"
                      onClick={() => {
                        field.onChange(isBad);
                        if (!isEdit) {
                          setValue('color', isBad ? '#6a6a6a' : '#555555');
                          setValue('icon', isBad ? 'ban' : 'circle-check');
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[12px] text-[13px] cursor-pointer transition-all duration-150 border-[1.5px] ${
                        active
                          ? isBad
                            ? 'border-[#6a6a6a] bg-[rgba(104,104,104,0.10)] text-[#6a6a6a] font-bold'
                            : 'border-accent-primary bg-[var(--accent-glow-md)] text-accent-primary font-bold'
                          : 'border-border-default bg-bg-tertiary text-text-muted font-medium'
                      }`}
                    >
                      {isBad ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      {isBad ? 'Bad Habit' : 'Good Habit'}
                    </button>
                  );
                })}
              </div>
            )}
          />

          {/* Bad habit contextual hint */}
          {watchIsBadHabit && (
            <div className="px-3.5 py-2.5 rounded-md bg-[rgba(104,104,104,0.08)] border border-[rgba(104,104,104,0.22)] text-[12.5px] text-[#8e8e8e] leading-[1.5]">
              <strong className="block mb-0.5">Avoidance tracking</strong>
              Each day you check this off means you <em>avoided</em> the bad habit. Your streak = consecutive days clean.
            </div>
          )}

          {/* Name */}
          <Input
            label="Name"
            required
            placeholder="e.g. Morning Run"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Description */}
          <div className={fieldClass}>
            <label className={labelClass}>
              Description
              <span className="text-text-muted font-normal ml-1">
                (optional)
              </span>
            </label>
            <textarea
              {...register('description')}
              placeholder="What's this habit about?"
              className={`w-full bg-bg-tertiary text-text-primary rounded-md px-3.5 py-2.5 text-[14px] resize-y outline-none min-h-[72px] [font-family:inherit] transition-colors box-border ${errors.description ? 'border border-danger' : 'border border-border-subtle focus:border-border-active'}`}
              maxLength={500}
            />
            <span className="text-xs text-text-muted text-right">
              {watchDescription.length} / 500
            </span>
            {errors.description && (
              <span className="text-[12px] text-danger">
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Color + Icon row */}
          <div className="flex gap-4 flex-wrap">
            {/* Color picker */}
            <div className={`${fieldClass} flex-[2] min-w-[180px]`}>
              <label className={labelClass}>Color</label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2 flex-wrap items-center">
                    {PRESET_COLORS.map((c) => {
                      const selected = field.value === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => field.onChange(c)}
                          aria-label={`Color ${c}`}
                          className="w-7 h-7 rounded-full cursor-pointer transition-all duration-150"
                          style={{
                            background: c,
                            border: selected
                              ? `2px solid white`
                              : '2px solid transparent',
                            boxShadow: selected
                              ? `0 0 0 2px ${c}, 0 0 10px ${hexToRgba(c, 0.5)}`
                              : 'none',
                            transform: selected ? 'scale(1.15)' : 'scale(1)',
                          }}
                        />
                      );
                    })}
                    {/* Custom hex input */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-xs border border-border-subtle flex-shrink-0"
                        style={{ background: watchColor }}
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="var(--accent-primary)"
                        className="w-[90px] bg-bg-tertiary text-text-secondary border border-border-subtle rounded-sm px-2 py-1 text-[12px] outline-none [font-family:'IBM_Plex_Mono',monospace]"
                      />
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Icon */}
            <div className={`${fieldClass} flex-[1.5] min-w-[260px]`}>
              <label className={labelClass}>Icon</label>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <IconPicker
                    value={field.value}
                    onChange={field.onChange}
                    color={watchColor}
                  />
                )}
              />
              {errors.icon && (
                <span className="text-[12px] text-danger mt-1">
                  {errors.icon.message}
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div className={fieldClass}>
            <label className={labelClass}>Category</label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => {
                const categoryOptions = [
                  { value: '', label: 'No category' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  { value: '__new__', label: '+ Create new category' },
                ];
                return (
                  <Select
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v || null)}
                    options={categoryOptions}
                    style={{ padding: '10px 14px' }}
                  />
                );
              }}
            />
            {categoryError && (
              <div className="mt-2 flex items-center gap-2 text-[12px] text-danger">
                <span>Couldn&apos;t load categories.</span>
                {onRetryCategories && (
                  <button
                    type="button"
                    onClick={onRetryCategories}
                    className="bg-[rgba(104,104,104,0.12)] text-danger border border-[rgba(104,104,104,0.25)] px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Frequency */}
          <div className={fieldClass}>
            <label className={labelClass}>Frequency</label>
            <Controller
              name="frequency.type"
              control={control}
              render={({ field }) => (
                <SegmentedControl<FrequencyTab>
                  options={['daily', 'weekly', 'x_per_week', 'x_per_month']}
                  labels={FREQUENCY_LABELS}
                  value={field.value as FrequencyTab}
                  onChange={(v) => {
                    field.onChange(v);
                    // Reset sub-fields and any validation errors from previous tab
                    setValue('frequency.days', []);
                    setValue('frequency.count', undefined);
                    clearErrors('frequency');
                  }}
                />
              )}
            />

            {/* Specific Days toggles */}
            {watchFrequencyType === 'weekly' && (
              <div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {DAY_LABELS.map((label, idx) => {
                    const active = watchFrequencyDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        aria-label={DAY_FULL_LABELS[idx]}
                        aria-pressed={active}
                        onClick={() => toggleDay(idx)}
                        className={`w-9 h-9 rounded-full text-[13px] cursor-pointer transition-all duration-150 border ${
                          active
                            ? 'border-accent-primary bg-accent-primary text-accent-on-primary font-bold'
                            : 'border-border-subtle bg-transparent text-text-secondary font-medium'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {errors.frequency && (errors.frequency as Record<string, {message?: string}>)['days']?.message && (
                  <span className="text-[12px] text-danger mt-1 block">
                    {(errors.frequency as Record<string, {message?: string}>)['days']!.message}
                  </span>
                )}
              </div>
            )}

            {/* Per Week / Per Month count */}
            {(watchFrequencyType === 'x_per_week' || watchFrequencyType === 'x_per_month') && (
              <div className="flex items-center gap-2.5 pt-1">
                <Input
                  type="number"
                  placeholder="3"
                  error={errors.frequency?.count?.message}
                  {...register('frequency.count', { valueAsNumber: true })}
                />
                <span className="text-[13px] text-text-muted whitespace-nowrap">
                  times {watchFrequencyType === 'x_per_week' ? 'per week' : 'per month'}
                </span>
              </div>
            )}
          </div>

          {/* Target */}
          <div className={fieldClass}>
            <label className={labelClass}>Target type</label>
            <Controller
              name="target_type"
              control={control}
              render={({ field }) => (
                <SegmentedControl<TargetTab>
                  options={['boolean', 'numeric', 'duration']}
                  labels={TARGET_LABELS}
                  value={field.value as TargetTab}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue('target_value', 1);
                    setValue('target_unit', null);
                  }}
                />
              )}
            />

            {watchTargetType === 'numeric' && (
              <div className="flex gap-2.5 pt-1">
                <Input
                  type="number"
                  placeholder="8"
                  label="Amount"
                  error={errors.target_value?.message}
                  {...register('target_value', { valueAsNumber: true })}
                />
                <Input
                  placeholder="glasses, pages..."
                  label="Unit"
                  error={errors.target_unit?.message}
                  {...register('target_unit')}
                />
              </div>
            )}

            {watchTargetType === 'duration' && (
              <div className="flex items-center gap-2.5 pt-1">
                <Input
                  type="number"
                  placeholder="30"
                  label="Duration"
                  error={errors.target_value?.message}
                  {...register('target_value', { valueAsNumber: true })}
                />
                <span className="text-[13px] text-text-muted mt-[22px] whitespace-nowrap">
                  minutes
                </span>
              </div>
            )}
          </div>

          {/* Reminder time */}
          <Input
            type="time"
            label="Reminder time (optional)"
            error={errors.reminder_time?.message}
            {...register('reminder_time')}
          />

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-md bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)] text-[13px] text-[var(--danger,var(--accent-primary))]"
            >
              {serverError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <Button
              variant="secondary"
              fullWidth
              onClick={onClose}
              type="button"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              type="submit"
              loading={loading}
            >
              {isEdit ? 'Update Habit' : 'Save Habit'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
