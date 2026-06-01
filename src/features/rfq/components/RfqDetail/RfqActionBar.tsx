import { ActionMenu } from '@/shared/components/ui/ActionMenu';
import type { RfqActionDescriptor, RfqActionKey } from '@/features/rfq/state/rfqStateMachine';

type RfqActionBarProps = {
  actions: RfqActionDescriptor[];
  onAction: (key: RfqActionKey) => void;
};

export function RfqActionBar({ actions, onAction }: RfqActionBarProps) {
  if (actions.length === 0) return null;

  // All actions surface through a single three-dot menu.
  const menuItems = actions.map((a) => ({
    key: a.key,
    label: a.label,
    tone: (a.tone === 'destructive' ? 'danger' : 'default') as 'danger' | 'default',
    disabled: a.disabled,
    onSelect: () => onAction(a.key),
  }));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionMenu actions={menuItems} buttonLabel="More actions" align="left" />
    </div>
  );
}
