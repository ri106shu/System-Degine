import { Construction } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

// Every nav item routes somewhere real, per the product's own rule that no
// visible link may go nowhere — this is the honest "not available yet"
// state, described in plain product terms rather than a development
// timeline the person using the app has no reason to care about.
export default function ComingSoonPage({ title, description }) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={Construction}
        title={`${title} isn't available yet`}
        description={description || `${title} hasn't been built yet.`}
      />
    </div>
  );
}
