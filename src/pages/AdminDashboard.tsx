import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { supabaseClient } from "../supabaseClient";
import { Product } from "../types";

import {
  Trash2,
  Upload,
  ImagePlus,
  Pencil,
  Image as ImageIcon,
} from "lucide-react";

const availabilityOptions = [
  "In Stock",
  "Limited Stock",
  "Out of Stock",
  "Pre-order",
];

interface ProductForm {
  name: string;
  category: string;
  brand: string;
  model: string;
  partNumber: string;
  price: number;
  discountPrice: number | null;
  showPrice: boolean;
  availability: string;
}

const emptyProduct: ProductForm = {
  name: "",
  category: "",
  brand: "",
  model: "",
  partNumber: "",
  price: 0,
  discountPrice: null,
  showPrice: true,
  availability: "In Stock",
};

export function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (!session) {
        // If no active session, redirect to login route
        navigate('/admin-login'); // Adjust this to match your actual route in App.tsx
      } else {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    navigate('/admin-login');
  };

  // Do not render the dashboard while checking credentials
  if (authLoading) {
    return <div className="p-10 text-center text-white">Checking authorization...</div>;
  }

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        navigate("/admin/login");
        return;
      }

      await loadProducts();
    }

    checkUser();
  }, [navigate]);

  async function getToken() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      navigate("/admin/login");
      throw new Error("Session expired");
    }

    return session.access_token;
  }

  function resetForm() {
    previewImages.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });

    setForm(emptyProduct);
    setEditingId(null);
    setExistingImages([]);
    setRemovedImages([]);
    setSelectedFiles([]);
    setPreviewImages([]);
  }

  function validateImage(file: File) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `${file.name}: only JPG, PNG and WebP images are allowed.`
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(
        `${file.name}: image must be smaller than 5MB.`
      );
    }
  }

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      setError("");

      const files = Array.from(e.target.files || []);

      if (files.length === 0) {
        return;
      }

      files.forEach(validateImage);

      const newPreviews = files.map((file) =>
        URL.createObjectURL(file)
      );

      setSelectedFiles((current) => [
        ...current,
        ...files,
      ]);

      setPreviewImages((current) => [
        ...current,
        ...newPreviews,
      ]);
    } catch (err) {
      e.target.value = "";

      setError(
        err instanceof Error
          ? err.message
          : "Invalid image"
      );
    }
  }

  function removeSelectedImage(index: number) {
    const preview = previewImages[index];

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreviewImages((current) =>
      current.filter((_, i) => i !== index)
    );

    setSelectedFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function removeExistingImage(imageUrl: string) {
    setExistingImages((current) =>
      current.filter((image) => image !== imageUrl)
    );

    setRemovedImages((current) => [
      ...current,
      imageUrl,
    ]);
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${extension}`;

      const { error } = await supabaseClient.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        throw new Error(
          `Failed to upload ${file.name}: ${error.message}`
        );
      }

      const { data } = supabaseClient.storage
        .from("product-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  async function deleteStorageImages(urls: string[]) {
    const paths: string[] = [];

    for (const url of urls) {
      const marker =
        "/storage/v1/object/public/product-images/";

      const index = url.indexOf(marker);

      if (index === -1) {
        continue;
      }

      const path = url.substring(index + marker.length);

      if (path) {
        paths.push(path);
      }
    }

    if (paths.length === 0) {
      return;
    }

    const { error } = await supabaseClient.storage
      .from("product-images")
      .remove(paths);

    if (error) {
      console.error("Storage delete error:", error);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    let newlyUploadedImages: string[] = [];

    try {
      const token = await getToken();

      if (!form.name.trim()) {
        throw new Error("Product name is required.");
      }

      if (!form.category.trim()) {
        throw new Error("Category is required.");
      }

      if (!form.brand.trim()) {
        throw new Error("Brand is required.");
      }

      if (!form.model.trim()) {
        throw new Error("Model is required.");
      }

      if (!form.partNumber.trim()) {
        throw new Error("Part number is required.");
      }

      if (form.price < 0) {
        throw new Error("Price cannot be negative.");
      }

      if (
        form.discountPrice !== null &&
        form.discountPrice < 0
      ) {
        throw new Error(
          "Discount price cannot be negative."
        );
      }

      if (
        form.discountPrice !== null &&
        form.discountPrice >= form.price
      ) {
        throw new Error(
          "Discount price must be lower than original price."
        );
      }

      if (selectedFiles.length > 0) {
        newlyUploadedImages = await uploadImages(
          selectedFiles
        );
      }

      const finalImages = [
        ...existingImages,
        ...newlyUploadedImages,
      ];

      const url = editingId
        ? `/api/admin/products/${editingId}`
        : "/api/admin/products";

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          imageUrl: finalImages[0] || null,
          imageUrls: finalImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save product."
        );
      }

      if (removedImages.length > 0) {
        await deleteStorageImages(removedImages);
      }

      setSuccess(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      if (newlyUploadedImages.length > 0) {
        await deleteStorageImages(newlyUploadedImages);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product: Product) {
    const productImages =
      product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : product.imageUrl
          ? [product.imageUrl]
          : [];

    setEditingId(product.id);

    setForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      model: product.model,
      partNumber: product.partNumber,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
      showPrice: product.showPrice,
      availability: product.availability,
    });

    setExistingImages(productImages);
    setRemovedImages([]);
    setSelectedFiles([]);
    setPreviewImages([]);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const token = await getToken();

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete product."
        );
      }

      const productImages =
        product.imageUrls && product.imageUrls.length > 0
          ? product.imageUrls
          : product.imageUrl
            ? [product.imageUrl]
            : [];

      if (productImages.length > 0) {
        await deleteStorageImages(productImages);
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      setSuccess("Product deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product."
      );
    }
  }

  async function updateProduct(
    product: Product,
    changes: Partial<Product>
  ) {
    try {
      const token = await getToken();

      const updatedProduct = {
        ...product,
        ...changes,
        imageUrl: product.imageUrl || null,
        imageUrls:
          product.imageUrls && product.imageUrls.length > 0
            ? product.imageUrls
            : product.imageUrl
              ? [product.imageUrl]
              : [],
      };

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedProduct),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update product"
        );
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? data.product : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update product"
      );
    }
  }

  async function logout() {
    await supabaseClient.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* HEADER */}
      <header className="bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              GearXpert Admin
            </h1>
            <p className="text-sm text-zinc-400">
              Product Management
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* MESSAGES */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
            {success}
          </div>
        )}

        {/* FORM - KEEPING CURRENT FUNCTIONALITY/UI */}
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Add product details and multiple product images.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-gray-500 hover:text-black"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Brand
              </label>
              <input
                value={form.brand}
                onChange={(e) =>
                  setForm({ ...form, brand: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Model
              </label>
              <input
                value={form.model}
                onChange={(e) =>
                  setForm({ ...form, model: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Part Number
              </label>
              <input
                value={form.partNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partNumber: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Original Price
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: Number(e.target.value),
                  })
                }
                className="w-full border rounded-lg px-3 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Discount Price
              </label>
              <input
                type="number"
                min="0"
                value={form.discountPrice ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountPrice:
                      e.target.value === ""
                        ? null
                        : Number(e.target.value),
                  })
                }
                className="w-full border rounded-lg px-3 py-2.5"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Availability
              </label>
              <select
                value={form.availability}
                onChange={(e) =>
                  setForm({
                    ...form,
                    availability: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-3 py-2.5"
              >
                {availabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Product Images
              </label>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl px-6 py-10 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition">
                <ImagePlus
                  size={32}
                  className="text-gray-400 mb-3"
                />
                <span className="font-semibold text-gray-700">
                  Click to choose images
                </span>
                <span className="text-sm text-gray-400 mt-1">
                  JPG, PNG or WebP • Max 5MB each
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {existingImages.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold mb-3">
                  Existing Images
                </h3>

                <div className="flex flex-wrap gap-4">
                  {existingImages.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative w-28 h-28 rounded-xl border overflow-hidden bg-gray-50"
                    >
                      <img
                        src={image}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                      />

                      <button
                        type="button"
                        onClick={() => removeExistingImage(image)}
                        className="absolute top-1 right-1 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewImages.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold mb-3">
                  New Images
                </h3>

                <div className="flex flex-wrap gap-4">
                  {previewImages.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative w-28 h-28 rounded-xl border overflow-hidden bg-gray-50"
                    >
                      <img
                        src={image}
                        alt={`New preview ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                      />

                      <button
                        type="button"
                        onClick={() => removeSelectedImage(index)}
                        className="absolute top-1 right-1 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.showPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      showPrice: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
                <span className="font-medium">
                  Show price to customers
                </span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg"
              >
                <Upload size={18} />
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ======================================== */}
        {/* CATALOG - UI ONLY CHANGED                */}
        {/* ======================================== */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold">
                Products ({products.length})
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage your GearXpert product catalog.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border shadow-sm p-10 text-center text-gray-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl border shadow-sm p-10 text-center">
              <p className="text-gray-500">
                No products found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const images =
                  product.imageUrls &&
                    product.imageUrls.length > 0
                    ? product.imageUrls
                    : product.imageUrl
                      ? [product.imageUrl]
                      : [];

                const hasDiscount =
                  product.discountPrice !== null &&
                  product.discountPrice !== undefined &&
                  product.discountPrice < product.price;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5"
                  >
                    <div className="flex flex-col lg:flex-row gap-5">
                      {/* IMAGE */}
                      <div className="w-full lg:w-32 flex-shrink-0">
                        <div className="relative aspect-square rounded-xl bg-gray-50 border border-gray-200 overflow-hidden">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt={product.name}
                              className="w-full h-full object-contain p-3"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                              <ImageIcon size={28} />
                              <span className="text-xs mt-2">
                                No Image
                              </span>
                            </div>
                          )}

                          {images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
                              {images.length} photos
                            </div>
                          )}
                        </div>
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {product.name}
                          </h3>

                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                            {product.category}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                          {product.brand} • {product.model}
                        </p>

                        <p className="text-xs text-gray-400 font-mono mt-2">
                          Part No: {product.partNumber}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.availability === "In Stock"
                                ? "bg-green-100 text-green-700"
                                : product.availability ===
                                  "Limited Stock"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                          >
                            {product.availability}
                          </span>

                          <span className="text-xs text-gray-500 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
                            {product.showPrice
                              ? "Price visible"
                              : "Price hidden"}
                          </span>
                        </div>
                      </div>

                      {/* PRICE */}
                      <div className="lg:w-44 lg:border-l lg:border-gray-100 lg:pl-5 flex flex-col justify-center">
                        <p className="text-xs text-gray-500 mb-1">
                          Price
                        </p>

                        {hasDiscount ? (
                          <>
                            <p className="text-sm text-gray-400 line-through">
                              Rs. {product.price.toLocaleString()}
                            </p>
                            <p className="font-bold text-green-600 text-lg">
                              Rs. {product.discountPrice!.toLocaleString()}
                            </p>
                            <span className="text-xs font-semibold text-green-600 mt-1">
                              Discount Price
                            </span>
                          </>
                        ) : (
                          <p className="font-bold text-lg text-gray-900">
                            Rs. {product.price.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* CONTROLS */}
                      <div className="lg:w-52 flex flex-col gap-3 justify-center">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">
                            Availability
                          </label>

                          <select
                            value={product.availability}
                            onChange={(e) =>
                              updateProduct(product, {
                                availability: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                          >
                            {availabilityOptions.map(
                              (option) => (
                                <option
                                  key={option}
                                  value={option}
                                >
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={product.showPrice}
                              onChange={(e) =>
                                updateProduct(product, {
                                  showPrice: e.target.checked,
                                })
                              }
                              className="h-4 w-4"
                            />
                            Show price
                          </label>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="lg:w-28 flex lg:flex-col gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(product)}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
