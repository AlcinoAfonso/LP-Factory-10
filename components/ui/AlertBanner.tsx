'use client';

import { useState, FormEvent } from 'react';

type Field =
  | { name: string; type: 'hidden'; defaultValue?: string }
  | {
      name: string;
      type: 'text';
      label?: string;
      placeholder?: string;
      defaultValue?: string;
      required?: boolean;
      minLength?: number;
      maxLength?: number;
    };

export type AlertBannerProps = {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  actionLabel?: string;
  fields?: Field[]; // ex.: [{name:'name', type:'text'}, {name:'account_id', type:'hidden', defaultValue:'...'}]
  onSubmit?: (data: FormData) => Promise<void>;
  submittingLabel?: string;
  className?: string;
};

export default function AlertBanner({
  type = 'info',
  title,
  description,
  actionLabel = 'Salvar',
  fields = [],
  onSubmit,
  submittingLabel = 'Salvando…',
  className = '',
}: AlertBannerProps) {
  const [submitting, setSubmitting] = useState(false);
  const tone =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-900'
      : type === 'warning'
      ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
      : type === 'error'
      ? 'bg-red-50 border-red-200 text-red-900'
      : 'bg-blue-50 border-blue-200 text-blue-900';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!onSubmit) return;
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      setSubmitting(true);
      await onSubmit(fd);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`mt-6 rounded-lg border p-4 ${tone} ${className}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm opacity-90">{description}</p>}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
        {fields.map((f, idx) =>
          f.type === 'hidden' ? (
            <input
              key={idx}
              type="hidden"
              name={f.name}
              defaultValue={f.defaultValue}
            />
          ) : (
            <div key={idx} className="flex items-center gap-2">
              {f.label && (
                <label htmlFor={`field-${f.name}`} className="text-sm font-medium">
                  {f.label}
                </label>
              )}
              <input
                id={`field-${f.name}`}
                name={f.name}
                type="text"
                placeholder={f.placeholder}
                defaultValue={f.defaultValue}
                required={f.required}
                minLength={f.minLength}
                maxLength={f.maxLength}
                className="w-72 rounded-md border bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>
          )
        )}

        {onSubmit && (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {submitting ? submittingLabel : actionLabel}
          </button>
        )}
      </form>
    </div>
  );
}
