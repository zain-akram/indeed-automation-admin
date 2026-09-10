'use client';

import { BriefcaseIcon, ChevronRightIcon, UserIcon, type LucideIcon } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { WhatsappIcon } from '@/components/whatsapp-icon';
import { EMAIL_PLACEHOLDER_FIELDS, type PlaceholderField } from '@/lib/email-placeholders';

const GROUP_ICONS: Record<string, LucideIcon | typeof WhatsappIcon> = {
  Contact: UserIcon,
  Job: BriefcaseIcon,
  WhatsApp: WhatsappIcon,
};

function GroupIcon({ group, className }: { group: string; className?: string }) {
  const Icon = GROUP_ICONS[group];
  if (!Icon) {
    return null;
  }
  return <Icon className={className} />;
}

export interface PlaceholderMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface PlaceholderMenuProps {
  query: string;
  onSelect: (field: PlaceholderField) => void;
}

interface GroupEntry {
  group: string;
  fields: PlaceholderField[];
}

function groupFields(fields: PlaceholderField[]): GroupEntry[] {
  const map = new Map<string, PlaceholderField[]>();
  for (const field of fields) {
    const list = map.get(field.group) ?? [];
    list.push(field);
    map.set(field.group, list);
  }
  return Array.from(map.entries()).map(([group, groupFields]) => ({ group, fields: groupFields }));
}

export const PlaceholderMenu = forwardRef<PlaceholderMenuRef, PlaceholderMenuProps>(function PlaceholderMenu(
  { query, onSelect },
  ref,
) {
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? EMAIL_PLACEHOLDER_FIELDS.filter(
        (field) =>
          field.label.toLowerCase().includes(trimmed) ||
          field.group.toLowerCase().includes(trimmed) ||
          field.value.toLowerCase().includes(trimmed),
      )
    : EMAIL_PLACEHOLDER_FIELDS;
  const nested = trimmed.length === 0;
  const groups = groupFields(filtered);

  const [activeGroup, setActiveGroup] = useState(0);
  const [activeItem, setActiveItem] = useState(nested ? -1 : 0);
  const [queryForSelection, setQueryForSelection] = useState(query);
  if (query !== queryForSelection) {
    setQueryForSelection(query);
    setActiveGroup(0);
    setActiveItem(nested ? -1 : 0);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (groups.length === 0) {
        return event.key === 'Escape';
      }
      const currentGroup = groups[Math.min(activeGroup, groups.length - 1)];
      const groupLength = currentGroup?.fields.length ?? 1;

      if (event.key === 'ArrowDown') {
        if (nested && activeItem === -1) {
          setActiveGroup((g) => (g + 1) % groups.length);
        } else {
          setActiveItem((i) => (i + 1) % groupLength);
        }
        return true;
      }
      if (event.key === 'ArrowUp') {
        if (nested && activeItem === -1) {
          setActiveGroup((g) => (g - 1 + groups.length) % groups.length);
        } else {
          setActiveItem((i) => (i - 1 + groupLength) % groupLength);
        }
        return true;
      }
      if (nested && event.key === 'ArrowRight' && activeItem === -1) {
        setActiveItem(0);
        return true;
      }
      if (nested && event.key === 'ArrowLeft' && activeItem !== -1) {
        setActiveItem(-1);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (nested && activeItem === -1) {
          setActiveItem(0);
          return true;
        }
        const field = currentGroup?.fields[activeItem];
        if (field) {
          onSelect(field);
        }
        return true;
      }
      if (event.key === 'Escape') {
        return true;
      }
      return false;
    },
  }));

  if (groups.length === 0) {
    return (
      <div className="rounded-none bg-popover p-2 text-xs text-muted-foreground ring-1 ring-foreground/10">
        No matching fields
      </div>
    );
  }

  if (!nested) {
    return (
      <div className="flex max-h-72 flex-col overflow-y-auto rounded-none bg-popover ring-1 ring-foreground/10">
        {groups.map((group, groupIndex) => (
          <div key={group.group}>
            <div className="flex items-center gap-1 px-3 pt-1.5 pb-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              <GroupIcon group={group.group} className="size-3" />
              {group.group}
            </div>
            {group.fields.map((field, fieldIndex) => (
              <button
                key={field.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => {
                  setActiveGroup(groupIndex);
                  setActiveItem(fieldIndex);
                }}
                onClick={() => onSelect(field)}
                className={`px-3 py-1.5 text-left text-xs whitespace-nowrap ${
                  groupIndex === activeGroup && fieldIndex === activeItem ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                {field.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-40 flex-col rounded-none bg-popover ring-1 ring-foreground/10">
      {groups.map((group, groupIndex) => {
        const isActiveGroup = groupIndex === activeGroup;
        const expanded = isActiveGroup && activeItem !== -1;
        return (
          <div key={group.group} className="group relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => {
                setActiveGroup(groupIndex);
                setActiveItem(0);
              }}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs ${
                isActiveGroup ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              <span className="flex items-center gap-1.5">
                <GroupIcon group={group.group} className="size-3.5" />
                {group.group}
              </span>
              <ChevronRightIcon className="size-3" />
            </button>
            <div
              className={`absolute top-0 left-full ml-0.5 flex-col rounded-none bg-popover ring-1 ring-foreground/10 group-hover:flex ${
                expanded ? 'flex' : 'hidden'
              }`}
            >
              {group.fields.map((field, fieldIndex) => (
                <button
                  key={field.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => {
                    setActiveGroup(groupIndex);
                    setActiveItem(fieldIndex);
                  }}
                  onClick={() => onSelect(field)}
                  className={`px-3 py-1.5 text-left text-xs whitespace-nowrap ${
                    isActiveGroup && fieldIndex === activeItem ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  {field.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
