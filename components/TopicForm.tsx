"use client";

import type { PipelineInput } from "@/lib/types";

interface TopicFormProps {
  value: PipelineInput;
  onChange: (v: PipelineInput) => void;
  disabled?: boolean;
}

export function TopicForm({ value, onChange, disabled }: TopicFormProps) {
  return (
    <fieldset
      disabled={disabled}
      className="grid gap-4 rounded-xl border border-border bg-surface/80 p-4 backdrop-blur"
    >
      <legend className="font-mono text-sm uppercase text-accent">
        Brief
      </legend>
      <label className="flex flex-col gap-2 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">Topic / title idea</span>
        <textarea
          value={value.topic}
          onChange={(e) => onChange({ ...value, topic: e.target.value })}
          rows={4}
          placeholder="e.g. Sustainable packaging for D2C skincare brands"
          className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-required="true"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">Audience</span>
        <input
          type="text"
          value={value.audience}
          onChange={(e) => onChange({ ...value, audience: e.target.value })}
          placeholder="e.g. ecommerce operators, founders, SEOs"
          className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">Search intent</span>
        <select
          value={value.intent}
          onChange={(e) =>
            onChange({
              ...value,
              intent: e.target.value as PipelineInput["intent"],
            })
          }
          className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="informational">Informational</option>
          <option value="commercial">Commercial</option>
          <option value="transactional">Transactional</option>
          <option value="navigational">Navigational</option>
        </select>
      </label>
    </fieldset>
  );
}
