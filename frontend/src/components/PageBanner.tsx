import { Breadcrumbs } from './Breadcrumbs';
import { Container, Eyebrow, Img } from './primitives';

type PageBannerProps = { eyebrow?: string; title: string; subtitle?: string; image: string };

/**
 * Photo header for listing pages. Used when an image is chosen in Settings → Home content;
 * the layout must be rendered with `bareTop` so the picture can sit under the transparent header.
 */
export const PageBanner = ({ eyebrow, title, subtitle, image }: PageBannerProps) => (
  <header className="relative -mt-24 flex min-h-[320px] items-end overflow-hidden bg-forest pt-24 sm:-mt-28 sm:min-h-[400px] sm:pt-28">
    <Img src={image} alt="" eager sizes="100vw" className="stz-kenburns absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/40" />
    <Container className="relative w-full pb-10 text-white sm:pb-14">
      <Breadcrumbs light className="mb-5" />
      {eyebrow && <Eyebrow light>{eyebrow}</Eyebrow>}
      <h1 className="font-serif-editorial max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-2xl text-base font-light text-white/85 sm:text-lg">{subtitle}</p>}
    </Container>
  </header>
);
