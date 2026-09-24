import { Link } from 'react-router';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function UnavailableFeatureCard({ icon: Icon, title, message, ctaLabel, ctaTo }) {
  return (
    <Card className="flex flex-col items-start gap-3 p-5">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[var(--color-text-faint)]" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{title}</h3>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo}>
          <Button variant="secondary" size="sm">
            {ctaLabel}
          </Button>
        </Link>
      )}
    </Card>
  );
}
