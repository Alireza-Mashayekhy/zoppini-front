import Image from 'next/image';
import Link from 'next/link';

interface BlogCardProps {
  title: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  publishedAt: string | null;
}

export default function BlogCard({
  title,
  excerpt,
  coverImage,
  slug,
  publishedAt,
}: BlogCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('fa-IR')
    : null;

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        {coverImage ? (
          <Image
            src={process.env.NEXT_PUBLIC_IMAGE_URL + coverImage}
            fill
            alt={title}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>
      <div className="px-2 pt-4 pb-8">
        {formattedDate && (
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        )}
        <h3 className="mt-1 text-lg line-clamp-2">{title}</h3>
        {excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
