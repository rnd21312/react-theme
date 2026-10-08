import { ChevronRight, Home } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useSite } from '@/site/context';

type BreadcrumbsProps = {
  /** Light text for use on top of a photo. */
  light?: boolean;
  className?: string;
};

/** Trail printed by PHP (same data as the BreadcrumbList JSON-LD). */
export const Breadcrumbs = ({ light = false, className = '' }: BreadcrumbsProps) => {
  const { data } = useSite();
  const trail = data.breadcrumbs;
  if (trail.length === 0) return null;

  const link = light ? 'text-white/80 hover:text-white' : 'text-muted hover:text-forest';
  const current = light ? 'text-white' : 'text-ink';

  return (
    <nav aria-label={__('Breadcrumb', 'suntourz')} className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        <li className="flex items-center gap-1.5">
          <a href={data.site.url} className={`inline-flex items-center gap-1 transition-colors ${link}`}>
            <Home className="h-3.5 w-3.5" aria-hidden />
            <span>{__('Home', 'suntourz')}</span>
          </a>
        </li>
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;

          return (
            <li key={`${crumb.name}-${index}`} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className={`h-3 w-3 shrink-0 ${light ? 'text-white/50' : 'text-muted-soft'}`} aria-hidden />
              {last || !crumb.url ? (
                <span aria-current="page" className={`truncate font-medium ${current}`}>{crumb.name}</span>
              ) : (
                <a href={crumb.url} className={`truncate transition-colors ${link}`}>{crumb.name}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
