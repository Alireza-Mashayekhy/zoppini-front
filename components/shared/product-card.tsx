import Image from 'next/image';

interface ProductProps {
  image: string;
  title: string;
  price: number;
}

export default function ProductCard({ image, title, price }: ProductProps) {
  return (
    <div>
      <div className="relative w-full aspect-9/16">
        <Image src={image} fill alt={title} className="object-cover" />
      </div>
      <div className="flex justify-between items-center px-5 pt-3 pb-12">
        <span className=" overflow-hidden text-ellipsis line-clamp-1">
          {title}
        </span>
        <span className="text-sm">{price.toLocaleString()} تومان</span>
      </div>
    </div>
  );
}
