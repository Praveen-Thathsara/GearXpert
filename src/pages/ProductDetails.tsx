import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  MessageCircle,
  Check,
} from "lucide-react";

import { Product } from "../types";
import { fetchProducts } from "../api";
import { useCartStore } from "../store/cartStore";

export function ProductDetails() {

  const { id } = useParams<{
    id: string;
  }>();

  const addItem = useCartStore(
    (state) => state.addItem
  );

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [currentImage, setCurrentImage] =
    useState(0);

  const touchStartX =
    useRef<number | null>(null);

  const touchEndX =
    useRef<number | null>(null);

  // --------------------------------------------
  // LOAD PRODUCT
  // --------------------------------------------

  useEffect(() => {

    async function loadProduct() {

      try {

        setLoading(true);
        setError("");

        const products =
          await fetchProducts();

        const foundProduct =
          products.find(
            (item) =>
              item.id === id
          );

        if (!foundProduct) {
          setError(
            "Product not found."
          );
          return;
        }

        setProduct(foundProduct);

      } catch (err) {

        console.error(err);

        setError(
          "Failed to load product."
        );

      } finally {

        setLoading(false);

      }
    }

    if (id) {
      loadProduct();
    }

  }, [id]);

  // --------------------------------------------
  // IMAGES
  // --------------------------------------------

  const images =
    product?.imageUrls &&
    product.imageUrls.length > 0
      ? product.imageUrls
      : product?.imageUrl
      ? [product.imageUrl]
      : [];

  useEffect(() => {
    setCurrentImage(0);
  }, [product?.id]);

  // --------------------------------------------
  // NAVIGATION
  // --------------------------------------------

  function nextImage() {

    if (images.length <= 1) {
      return;
    }

    setCurrentImage(
      (current) =>
        (current + 1) %
        images.length
    );
  }

  function previousImage() {

    if (images.length <= 1) {
      return;
    }

    setCurrentImage(
      (current) =>
        (current - 1 + images.length) %
        images.length
    );
  }

  // --------------------------------------------
  // SWIPE
  // --------------------------------------------

  function handleTouchStart(
    e: React.TouchEvent
  ) {

    touchStartX.current =
      e.changedTouches[0].clientX;

  }

  function handleTouchEnd(
    e: React.TouchEvent
  ) {

    touchEndX.current =
      e.changedTouches[0].clientX;

    if (
      touchStartX.current === null ||
      touchEndX.current === null
    ) {
      return;
    }

    const difference =
      touchStartX.current -
      touchEndX.current;

    const minimumSwipeDistance = 50;

    if (
      Math.abs(difference) >=
      minimumSwipeDistance
    ) {

      if (difference > 0) {
        nextImage();
      } else {
        previousImage();
      }

    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  // --------------------------------------------
  // ADD TO CART
  // --------------------------------------------

  function handleAddToCart() {

    if (!product) {
      return;
    }

    addItem(product);
  }

  // --------------------------------------------
  // LOADING
  // --------------------------------------------

  if (loading) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">
          Loading product...
        </p>
      </div>
    );

  }

  // --------------------------------------------
  // ERROR
  // --------------------------------------------

  if (error || !product) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        <div className="text-center">

          <p className="text-red-500 text-lg font-semibold">
            {error || "Product not found"}
          </p>

          <Link
            to="/"
            className="inline-block mt-4 text-orange-400 hover:text-orange-300"
          >
            Back to Home
          </Link>

        </div>

      </div>
    );

  }

  const hasDiscount =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice < product.price;

  // --------------------------------------------
  // PAGE
  // --------------------------------------------

  return (
    <div className="min-h-screen bg-black text-white">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* BACK */}
        <Link
          to="/#catalog"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        {/* PRODUCT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ================================= */}
          {/* IMAGE GALLERY */}
          {/* ================================= */}

          <div>

            {/* MAIN IMAGE */}
            <div
              className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >

              <div className="aspect-square">

                {images.length > 0 ? (

                  <img
                    src={
                      images[currentImage]
                    }
                    alt={`${product.name} ${
                      currentImage + 1
                    }`}
                    className="w-full h-full object-contain p-5 sm:p-8 select-none"
                    draggable={false}
                  />

                ) : (

                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    No Image Available
                  </div>

                )}

              </div>

              {/* PREVIOUS */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={previousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 border border-zinc-700 flex items-center justify-center hover:bg-zinc-800 transition"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              {/* NEXT */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 border border-zinc-700 flex items-center justify-center hover:bg-zinc-800 transition"
                  aria-label="Next image"
                >
                  <ChevronRight size={22} />
                </button>
              )}

              {/* IMAGE COUNTER */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 px-3 py-1.5 rounded-full text-xs text-white">
                  {currentImage + 1} /{" "}
                  {images.length}
                </div>
              )}

            </div>

            {/* THUMBNAILS */}
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">

                {images.map(
                  (image, index) => (

                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setCurrentImage(index)
                      }
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                        currentImage === index
                          ? "border-orange-500"
                          : "border-zinc-800 hover:border-zinc-600"
                      }`}
                    >

                      <img
                        src={image}
                        alt={`Thumbnail ${
                          index + 1
                        }`}
                        className="w-full h-full object-contain bg-zinc-950 p-1"
                      />

                    </button>

                  )
                )}

              </div>
            )}

            {/* MOBILE SWIPE HINT */}
            {images.length > 1 && (
              <p className="text-center text-xs text-zinc-600 mt-2 lg:hidden">
                Swipe image to see more
              </p>
            )}

          </div>

          {/* ================================= */}
          {/* PRODUCT INFO */}
          {/* ================================= */}

          <div className="flex flex-col">

            {/* CATEGORY */}
            <p className="text-sm text-orange-400 uppercase tracking-wider font-semibold">
              {product.category}
            </p>

            {/* NAME */}
            <h1 className="text-3xl sm:text-4xl font-bold mt-3 leading-tight">
              {product.name}
            </h1>

            {/* BRAND / MODEL */}
            <p className="text-zinc-400 mt-4 text-lg">
              {product.brand} •{" "}
              {product.model}
            </p>

            {/* PART NUMBER */}
            <div className="mt-3 text-sm text-zinc-500">
              Part Number:
              <span className="ml-2 text-zinc-300 font-mono">
                {product.partNumber}
              </span>
            </div>

            {/* AVAILABILITY */}
            <div className="mt-6">

              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                  product.availability ===
                  "In Stock"
                    ? "bg-green-500/10 text-green-400"
                    : product.availability ===
                      "Limited Stock"
                    ? "bg-orange-500/10 text-orange-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {product.availability}
              </span>

            </div>

            {/* PRICE */}
            <div className="mt-8">

              {product.showPrice ? (

                hasDiscount ? (

                  <>
                    <div className="flex items-center gap-3">

                      <span className="text-lg text-zinc-500 line-through">
                        Rs.{" "}
                        {product.price.toLocaleString()}
                      </span>

                      <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded">
                        DISCOUNT
                      </span>

                    </div>

                    <div className="text-4xl font-bold text-green-400 mt-2">
                      Rs.{" "}
                      {product.discountPrice!.toLocaleString()}
                    </div>

                  </>

                ) : (

                  <div className="text-4xl font-bold">
                    Rs.{" "}
                    {product.price.toLocaleString()}
                  </div>

                )

              ) : (

                <div className="text-xl font-semibold text-orange-400">
                  Contact for Price
                </div>

              )}

            </div>

            {/* DIVIDER */}
            <div className="border-t border-zinc-800 my-8" />

            {/* COMPATIBILITY / INFO */}
            <div>

              <h2 className="text-lg font-bold">
                Product Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500">
                    Brand
                  </p>

                  <p className="mt-1 font-semibold">
                    {product.brand}
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500">
                    Model
                  </p>

                  <p className="mt-1 font-semibold">
                    {product.model}
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500">
                    Category
                  </p>

                  <p className="mt-1 font-semibold">
                    {product.category}
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500">
                    Part Number
                  </p>

                  <p className="mt-1 font-semibold font-mono">
                    {product.partNumber}
                  </p>
                </div>

              </div>

            </div>

            {/* FEATURES */}
            <div className="mt-8 space-y-3">

              <div className="flex items-center gap-3 text-zinc-300">
                <Check
                  size={18}
                  className="text-green-400"
                />
                Product availability shown live
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <Check
                  size={18}
                  className="text-green-400"
                />
                Genuine product information
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <Check
                  size={18}
                  className="text-green-400"
                />
                Contact us for compatibility confirmation
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">

              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl transition"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>

              <a
                href={`https://wa.me/94771234567?text=${encodeURIComponent(
                  `Hello GearXpert, I am interested in ${product.name} (${product.partNumber}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>

            </div>

            <p className="text-xs text-zinc-600 text-center mt-4">
              Need help? Contact GearXpert before placing your request.
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}