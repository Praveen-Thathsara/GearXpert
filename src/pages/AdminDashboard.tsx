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
  showPrice: true,
  availability: "In Stock",
};

export function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyProduct);

  // ---------------------------------------------
  // LOAD PRODUCTS
  // ---------------------------------------------

  async function loadProducts() {
    try {
      setLoading(true);

      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error(error);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------
  // CHECK LOGIN
  // ---------------------------------------------

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        navigate("/admin/login");
        return;
      }

      loadProducts();
    }

    checkUser();
  }, [navigate]);

  // ---------------------------------------------
  // GET AUTH TOKEN
  // ---------------------------------------------

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

  // ---------------------------------------------
  // ADD PRODUCT
  // ---------------------------------------------

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const token = await getToken();

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add product");
      }

      setProducts((current) => [
        data.product,
        ...current,
      ]);

      setForm(emptyProduct);
      setShowForm(false);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------
  // UPDATE PRODUCT
  // ---------------------------------------------

  async function updateProduct(
    product: Product,
    changes: Partial<Product>
  ) {
    try {
      const token = await getToken();

      const updatedProduct = {
        ...product,
        ...changes,
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
          item.id === product.id
            ? data.product
            : item
        )
      );
    } catch (error: any) {
      console.error(error);
      setError(
        error.message || "Failed to update product."
      );
    }
  }

  // ---------------------------------------------
  // DELETE PRODUCT
  // ---------------------------------------------

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
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
          data.error || "Failed to delete product"
        );
      }

      setProducts((current) =>
        current.filter(
          (item) => item.id !== product.id
        )
      );
    } catch (error: any) {
      console.error(error);
      setError(
        error.message || "Failed to delete product."
      );
    }
  }

  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------

  async function logout() {
    await supabaseClient.auth.signOut();

    navigate("/admin/login");
  }

  // ---------------------------------------------
  // UI
  // ---------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Loading products...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}

      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              GearXpert Admin
            </h1>

            <p className="text-sm text-gray-500">
              Product Management
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              {showForm
                ? "Close"
                : "+ Add Product"}
            </button>

            <button
              onClick={logout}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* ADD PRODUCT FORM */}

        {showForm && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border">
            <h2 className="text-xl font-bold mb-6">
              Add New Product
            </h2>

            <form
              onSubmit={handleAddProduct}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Product Name
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Honda Dio Brake Pad"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Category
                </label>

                <input
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Brake Parts"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Brand
                </label>

                <input
                  required
                  value={form.brand}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      brand: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Honda"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Model
                </label>

                <input
                  required
                  value={form.model}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      model: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="Dio"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Part Number
                </label>

                <input
                  required
                  value={form.partNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      partNumber: e.target.value,
                    })
                  }
                  className="admin-input"
                  placeholder="BP-DIO-001"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Price
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
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Availability
                </label>

                <select
                  value={form.availability}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      availability:
                        e.target.value,
                    })
                  }
                  className="admin-input"
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

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.showPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      showPrice:
                        e.target.checked,
                    })
                  }
                  className="h-5 w-5"
                />

                <label className="text-sm font-medium">
                  Show price to customers
                </label>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving
                    ? "Adding..."
                    : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PRODUCT COUNT */}

        <div className="mb-5">
          <h2 className="text-xl font-bold">
            Products ({products.length})
          </h2>
        </div>

        {/* PRODUCTS */}

        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border shadow-sm p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                {/* PRODUCT INFO */}

                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {product.brand} •{" "}
                    {product.model}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Part No:{" "}
                    {product.partNumber}
                  </p>
                </div>

                {/* PRICE */}

                <div className="lg:w-32">
                  <p className="text-xs text-gray-500 mb-1">
                    Price
                  </p>

                  <p className="font-semibold">
                    Rs.{" "}
                    {product.price.toLocaleString()}
                  </p>
                </div>

                {/* AVAILABILITY */}

                <div className="lg:w-44">
                  <p className="text-xs text-gray-500 mb-1">
                    Availability
                  </p>

                  <select
                    value={product.availability}
                    onChange={(e) =>
                      updateProduct(
                        product,
                        {
                          availability:
                            e.target.value,
                        }
                      )
                    }
                    className="admin-input"
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

                {/* SHOW PRICE */}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.showPrice}
                    onChange={(e) =>
                      updateProduct(
                        product,
                        {
                          showPrice:
                            e.target.checked,
                        }
                      )
                    }
                    className="h-5 w-5"
                  />

                  <span className="text-sm">
                    Show price
                  </span>
                </div>

                {/* DELETE */}

                <button
                  onClick={() =>
                    deleteProduct(product)
                  }
                  className="rounded-lg bg-red-50 px-4 py-2.5 font-semibold text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center">
            <p className="text-gray-500">
              No products found.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}