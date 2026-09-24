import { ShoppingCart, MessageCircle, Images } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../types";
import { useCartStore } from "../store/cartStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const mainImage = images[0] ?? null;

  const hasDiscount =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice < product.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100
      )
    : 0;

  const availabilityStyles =
    product.availability === "In Stock"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : product.availability === "Limited Stock"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : product.availability === "Out of Stock"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-blue-500/10 text-blue-400 border-blue-500/20";

  function handleAddToCart() {
    addItem(product);
  }

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-xl">
      {/* IMAGE AREA */}
      <Link
        to={`/products/${product.id}`}
        className="block"
        aria-label={`View details for ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden bg-zinc-950">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-zinc-600">
              <Images size={32} strokeWidth={1.5} />
              <span className="mt-2 text-xs">No image</span>
            </div>
          )}

          {/* AVAILABILITY */}
          <span
            className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${availabilityStyles}`}
          >
            {product.availability}
          </span>

          {/* DISCOUNT */}
          {hasDiscount && (
            <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold leading-none text-black">
              -{discountPercentage}%
            </span>
          )}

          {/* IMAGE COUNT */}
          {images.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {images.length} photos
            </span>
          )}
        </div>
      </Link>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* CATEGORY */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-400">
          {product.category}
        </p>

        {/* TITLE */}
        <Link
          to={`/products/${product.id}`}
          className="mt-1.5 block"
        >
          <h3 className="min-h-[3rem] text-base font-bold leading-6 text-white transition-colors group-hover:text-orange-400 sm:text-lg">
            {product.name}
          </h3>
        </Link>

        {/* META */}
        <p className="mt-2 text-sm text-zinc-400">
          {product.brand} <span className="text-zinc-600">•</span>{" "}
          {product.model}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Part No:{" "}
          <span className="font-mono text-zinc-500">
            {product.partNumber}
          </span>
        </p>

        {/* PRICE */}
        <div className="mt-auto pt-4">
          {product.showPrice ? (
            hasDiscount ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 line-through sm:text-sm">
                    Rs. {product.price.toLocaleString()}
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                    Sale
                  </span>
                </div>

                <p className="text-xl font-extrabold tracking-tight text-emerald-400 sm:text-2xl">
                  Rs. {product.discountPrice!.toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Rs. {product.price.toLocaleString()}
              </p>
            )
          ) : (
            <p className="text-sm font-semibold text-orange-400">
              Contact for Price
            </p>
          )}
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-black transition-colors hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <ShoppingCart size={16} />
            Add
          </button>

          <a
            href={`https://wa.me/94771234567?text=${encodeURIComponent(
              `Hello GearXpert, I am interested in ${product.name} (${product.partNumber}).`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </div>

        {/* DETAILS */}
        <Link
          to={`/products/${product.id}`}
          className="mt-3 flex min-h-10 items-center justify-center rounded-xl border border-zinc-800 px-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          View product details
          <span className="ml-1.5 transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
