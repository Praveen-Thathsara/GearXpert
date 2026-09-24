import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../supabaseClient";
import { Product } from "../types";

const availabilityOptions = [
  "In Stock",
  "Limited Stock",
  "Out of Stock",
  "Pre-order",
];

const emptyProduct = {
  name: "",
  category: "",
  brand: "",
  model: "",
  partNumber: "",
  price: 0,
  discountPrice: null as number | null,
  showPrice: true,
  availability: "In Stock",
};

export function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyProduct);

  const [editingId, setEditingId] = useState<string | null>(null);

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
    async function checkAuth() {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        navigate("/admin/login");
        return;
      }

      await loadProducts();
    }

    checkAuth();
  }, [navigate]);

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Authentication session expired");
    }

    return session.access_token;
  }

  function resetForm() {
    setForm(emptyProduct);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = await getAccessToken();

      if (!form.name.trim()) {
        throw new Error("Product name is required");
      }

      if (!form.category.trim()) {
        throw new Error("Category is required");
      }

      if (!form.brand.trim()) {
        throw new Error("Brand is required");
      }

      if (!form.model.trim()) {
        throw new Error("Model is required");
      }

      if (!form.partNumber.trim()) {
        throw new Error("Part number is required");
      }

      if (form.price < 0) {
        throw new Error("Price cannot be negative");
      }

      if (
        form.discountPrice !== null &&
        form.discountPrice < 0
      ) {
        throw new Error("Discount price cannot be negative");
      }

      if (
        form.discountPrice !== null &&
        form.discountPrice >= form.price
      ) {
        throw new Error(
          "Discount price must be lower than the original price"
        );
      }

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
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save product"
        );
      }

      setSuccess(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      model: product.model,
      partNumber: product.partNumber,
      price: product.price,
      discountPrice:
        product.discountPrice ?? null,
      showPrice: product.showPrice,
      availability: product.availability,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const token = await getAccessToken();

      const response = await fetch(
        `/api/admin/products/${id}`,
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
          data.error || "Failed to delete product"
        );
      }

      setSuccess("Product deleted successfully.");

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product"
      );
    }
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="admin-dashboard min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}
      <header className="bg-white border-b border-zinc-200 text-white">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold">
              GearXpert Admin
            </h1>

            <p className="text-xs text-zinc-400">
              Product Management
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded text-sm font-semibold"
          >
            Logout
          </button>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* MESSAGES */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                {editingId
                  ? "Edit Product"
                  : "Add New Product"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Add product information and pricing.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-600 hover:text-black font-semibold"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            {/* PRODUCT NAME */}
            <div>
              <label className="block mb-2 text-sm font-medium">
                Product Name
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Product name"
                required
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block mb-2 text-sm font-medium">
                Category
              </label>

              <input
                type="text"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Engine, Brake, Electrical..."
                required
              />
            </div>

            {/* BRAND */}
            <div>
              <label className="block mb-2 text-sm font-medium">
                Brand
              </label>

              <input
                type="text"
                value={form.brand}
                onChange={(e) =>
                  setForm({
                    ...form,
                    brand: e.target.value,
                  })
                }
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Toyota, Honda..."
                required
              />
            </div>

            {/* MODEL */}
            <div>
              <label className="block mb-2 text-sm font-medium">
                Model
              </label>

              <input
                type="text"
                value={form.model}
                onChange={(e) =>
                  setForm({
                    ...form,
                    model: e.target.value,
                  })
                }
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Model"
                required
              />
            </div>

            {/* PART NUMBER */}
            <div>
              <label className="block mb-2 text-sm font-medium">
                Part Number
              </label>

              <input
                type="text"
                value={form.partNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partNumber: e.target.value,
                  })
                }
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Part number"
                required
              />
            </div>

            {/* ORIGINAL PRICE */}
            <div>
              <label className="block mb-2 text-sm font-medium">
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
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
                placeholder="0"
                required
              />
            </div>

            {/* DISCOUNT PRICE */}
            <div>
              <label className="block mb-2 text-sm font-medium">
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
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Optional"
              />

              <p className="text-xs text-gray-500 mt-1">
                Leave empty if there is no discount.
              </p>
            </div>

            {/* AVAILABILITY */}
            <div>
              <label className="block mb-2 text-sm font-medium">
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
                className="admin-input w-full border border-gray-300 rounded px-3 py-2"
              >
                {availabilityOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* SHOW PRICE */}
            <div className="md:col-span-2">

              <label className="inline-flex items-center gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  checked={form.showPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      showPrice: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm font-medium">
                  Show price to customers
                </span>

              </label>

            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2 flex gap-3">

              <button
                type="submit"
                disabled={saving}
                className="bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold px-6 py-3 rounded"
              >
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
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold px-6 py-3 rounded"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>
        </section>

        {/* PRODUCT LIST */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">

          <div className="p-6 border-b border-gray-200">

            <h2 className="text-xl font-bold">
              Products
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage your GearXpert product catalog.
            </p>

          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No products found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">

              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >

                  {/* PRODUCT INFO */}
                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-2 mb-2">

                      <h3 className="font-bold text-gray-900">
                        {product.name}
                      </h3>

                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {product.category}
                      </span>

                    </div>

                    <p className="text-sm text-gray-500">
                      {product.brand} {product.model}
                    </p>

                    <p className="text-xs text-gray-400 font-mono mt-1">
                      PN: {product.partNumber}
                    </p>

                  </div>

                  {/* PRICE */}
                  <div className="min-w-[160px]">

                    {product.discountPrice !== null &&
                    product.discountPrice !== undefined &&
                    product.discountPrice < product.price ? (
                      <>
                        <p className="text-sm text-gray-400 line-through">
                          Rs. {product.price.toLocaleString()}
                        </p>

                        <p className="font-bold text-green-600">
                          Rs.{" "}
                          {product.discountPrice.toLocaleString()}
                        </p>

                        <p className="text-xs text-green-600 font-semibold">
                          Discount Price
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold">
                        Rs. {product.price.toLocaleString()}
                      </p>
                    )}

                  </div>

                  {/* AVAILABILITY */}
                  <div className="min-w-[150px]">

                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        product.availability === "In Stock"
                          ? "bg-green-100 text-green-700"
                          : product.availability.includes(
                              "Limited"
                            )
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.availability}
                    </span>

                  </div>

                  {/* SHOW PRICE */}
                  <div className="min-w-[100px]">

                    <label className="flex items-center gap-2 text-sm">

                      <input
                        type="checkbox"
                        checked={product.showPrice}
                        readOnly
                      />

                      Show Price

                    </label>

                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">

                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(product.id)
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}