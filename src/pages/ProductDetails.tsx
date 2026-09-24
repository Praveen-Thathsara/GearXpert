import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  CheckCircle,
} from "lucide-react";

import { Product } from "../types";
import { fetchProducts } from "../api";
import { useCartStore } from "../store/cartStore";
import { config } from "../config";

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);

        const products = await fetchProducts();

        const foundProduct = products.find(
          (item) => item.id === id
        );

        if (!foundProduct) {
          setError("Product not found");
          return;
        }

        setProduct(foundProduct);
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  const getWhatsAppLink = () => {
    if (!product) return "#";

    const message = encodeURIComponent(
      `Hello, I am interested in ${product.name} (Part No: ${product.partNumber}). Is this available?`
    );

    const numericNumber = config.whatsapp.replace(/[^0-9]/g, "");

    return `https://wa.me/${numericNumber}?text=${message}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">
          {error || "Product not found"}
        </p>

        <Link
          to="/"
          className="text-amber-500 hover:text-amber-400"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>

        {/* Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Product Image */}
          <div className="aspect-square bg-zinc-900 border border-zinc-800 rounded-sm flex items-center justify-center">
            <span className="text-zinc-500 text-lg text-center px-8">
              {product.name}
            </span>
          </div>

          {/* Product Details */}
          <div>

            {/* Category */}
            <div className="mb-4">
              <span className="inline-block text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-sm uppercase tracking-wider">
                {product.category}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
              {product.name}
            </h1>

            {/* Part Number */}
            <p className="text-sm text-zinc-500 mb-6">
              Part Number:{" "}
              <span className="font-mono text-zinc-300">
                {product.partNumber}
              </span>
            </p>

            {/* Availability */}
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle
                className={`w-5 h-5 ${
                  product.availability === "In Stock"
                    ? "text-green-500"
                    : product.availability.includes("Limited")
                    ? "text-orange-500"
                    : "text-red-500"
                }`}
              />

              <span className="text-sm font-semibold">
                {product.availability}
              </span>
            </div>

            {/* PRICE */}
            <div className="text-3xl font-bold text-zinc-100 mb-8">
              {product.showPrice ? (
                product.discountPrice !== null &&
                product.discountPrice !== undefined &&
                product.discountPrice < product.price ? (
                  <div>

                    {/* Original Price */}
                    <div className="text-lg text-zinc-500 line-through">
                      Rs. {product.price.toLocaleString()}
                    </div>

                    {/* Discount Price */}
                    <div className="text-3xl text-amber-500 font-extrabold">
                      Rs. {product.discountPrice.toLocaleString()}
                    </div>

                    {/* Discount Text */}
                    <div className="text-sm text-green-500 font-semibold mt-1">
                      Special Discount Price
                    </div>

                  </div>
                ) : (
                  <span>
                    Rs. {product.price.toLocaleString()}
                  </span>
                )
              ) : (
                "Contact for Price"
              )}
            </div>

            {/* Vehicle Compatibility */}
            <div className="border-t border-zinc-800 pt-6 mb-6">

              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400 mb-3">
                Vehicle Compatibility
              </h2>

              <p className="text-zinc-200">
                <span className="text-zinc-500">Brand:</span>{" "}
                {product.brand}
              </p>

              <p className="text-zinc-200">
                <span className="text-zinc-500">Model:</span>{" "}
                {product.model}
              </p>

            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Add To Cart */}
              <button
                onClick={() => addItem(product)}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 px-5 rounded-sm transition-colors uppercase tracking-wide"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Request
              </button>

              {/* WhatsApp */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-green-500 font-bold py-3 px-5 rounded-sm transition-colors border border-zinc-800 uppercase tracking-wide"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}