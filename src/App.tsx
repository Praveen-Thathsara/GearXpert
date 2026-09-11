/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Layout } from "./components/Layout";

import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetails } from "./pages/ProductDetails";
import { Cart } from "./pages/Cart";
import { CustomerRequest } from "./pages/CustomerRequest";
import { Success } from "./pages/Success";

import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* CUSTOMER WEBSITE */}

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route
            path="products"
            element={
              <Navigate
                to="/#catalog"
                replace
              />
            }
          />

          <Route
            path="products/:slug"
            element={<ProductDetails />}
          />

          <Route
            path="cart"
            element={<Cart />}
          />

          <Route
            path="request"
            element={<CustomerRequest />}
          />

          <Route
            path="success"
            element={<Success />}
          />
        </Route>

        {/* ADMIN */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}