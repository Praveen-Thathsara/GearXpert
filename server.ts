import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import "dotenv/config";
import dns from "node:dns";
import { supabase } from "./src/supabaseServer";

dns.setDefaultResultOrder("ipv4first");

type AuthenticatedRequest = express.Request & {
  user?: any;
};

async function startServer() {
  const app = express();

  const PORT = Number(process.env.PORT || 3000);

  // --------------------------------------------------
  // MIDDLEWARE
  // --------------------------------------------------

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(cors());

  app.use(express.json());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  });

  // --------------------------------------------------
  // ADMIN AUTHENTICATION
  // --------------------------------------------------

  const requireAdmin = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const token = authHeader.replace("Bearer ", "");

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({
          error: "Invalid or expired session",
        });
      }

      req.user = data.user;

      next();
    } catch (error) {
      console.error("Authentication error:", error);

      return res.status(401).json({
        error: "Authentication failed",
      });
    }
  };

  // --------------------------------------------------
  // HEALTH CHECK
  // --------------------------------------------------

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
    });
  });

  // --------------------------------------------------
  // GET PRODUCTS
  // --------------------------------------------------

  app.get("/api/products", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Error fetching products:", error);

        return res.status(500).json({
          error: "Failed to fetch products",
        });
      }

      const products = data.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        model: product.model,
        partNumber: product.part_number,
        price: Number(product.price),
        showPrice: product.show_price,
        availability: product.availability,
      }));

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);

      res.status(500).json({
        error: "Failed to fetch products",
      });
    }
  });

  // --------------------------------------------------
  // ADMIN - ADD PRODUCT
  // --------------------------------------------------

  app.post(
    "/api/admin/products",
    requireAdmin,
    async (req, res) => {
      try {
        const {
          name,
          category,
          brand,
          model,
          partNumber,
          price,
          showPrice,
          availability,
        } = req.body;

        if (
          !name ||
          !category ||
          !brand ||
          !model ||
          !partNumber
        ) {
          return res.status(400).json({
            error: "Required product fields are missing.",
          });
        }

        const { data, error } = await supabase
          .from("products")
          .insert({
            name,
            category,
            brand,
            model,
            part_number: partNumber,
            price: Number(price) || 0,
            show_price:
              typeof showPrice === "boolean"
                ? showPrice
                : true,
            availability:
              availability || "In Stock",
          })
          .select()
          .single();

        if (error) {
          console.error("Add product error:", error);

          return res.status(500).json({
            error: "Failed to add product.",
          });
        }

        res.status(201).json({
          success: true,
          product: {
            id: data.id,
            name: data.name,
            category: data.category,
            brand: data.brand,
            model: data.model,
            partNumber: data.part_number,
            price: Number(data.price),
            showPrice: data.show_price,
            availability: data.availability,
          },
        });
      } catch (error) {
        console.error("Add product error:", error);

        res.status(500).json({
          error: "Failed to add product.",
        });
      }
    }
  );

  // --------------------------------------------------
  // ADMIN - UPDATE PRODUCT
  // --------------------------------------------------

  app.patch(
    "/api/admin/products/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;

        const {
          name,
          category,
          brand,
          model,
          partNumber,
          price,
          showPrice,
          availability,
        } = req.body;

        const { data, error } = await supabase
          .from("products")
          .update({
            name,
            category,
            brand,
            model,
            part_number: partNumber,
            price: Number(price) || 0,
            show_price:
              typeof showPrice === "boolean"
                ? showPrice
                : true,
            availability,
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error(
            "Update product error:",
            error
          );

          return res.status(500).json({
            error: "Failed to update product.",
          });
        }

        res.json({
          success: true,
          product: {
            id: data.id,
            name: data.name,
            category: data.category,
            brand: data.brand,
            model: data.model,
            partNumber: data.part_number,
            price: Number(data.price),
            showPrice: data.show_price,
            availability: data.availability,
          },
        });
      } catch (error) {
        console.error(
          "Update product error:",
          error
        );

        res.status(500).json({
          error: "Failed to update product.",
        });
      }
    }
  );

  // --------------------------------------------------
  // ADMIN - DELETE PRODUCT
  // --------------------------------------------------

  app.delete(
    "/api/admin/products/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;

        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", id);

        if (error) {
          console.error(
            "Delete product error:",
            error
          );

          return res.status(500).json({
            error: "Failed to delete product.",
          });
        }

        res.json({
          success: true,
          message: "Product deleted successfully.",
        });
      } catch (error) {
        console.error(
          "Delete product error:",
          error
        );

        res.status(500).json({
          error: "Failed to delete product.",
        });
      }
    }
  );

  // --------------------------------------------------
  // CUSTOMER PARTS REQUEST
  // --------------------------------------------------

  app.post(
    "/api/requests",
    apiLimiter,
    async (req, res) => {
      try {
        const { customer, items } = req.body;

        if (
          !customer ||
          !items ||
          !Array.isArray(items) ||
          items.length === 0
        ) {
          return res.status(400).json({
            error:
              "Invalid request data. Customer details and items are required.",
          });
        }

        // Required customer information
        if (
          !customer.fullName ||
          !customer.phone ||
          !customer.whatsapp ||
          !customer.location
        ) {
          return res.status(400).json({
            error:
              "Missing required customer details.",
          });
        }

        // Get products from Supabase
        const productIds = items.map(
          (item: any) => item.productId
        );

        const { data: products, error } =
          await supabase
            .from("products")
            .select("*")
            .in("id", productIds);

        if (error) {
          console.error(
            "Product validation error:",
            error
          );

          return res.status(500).json({
            error:
              "Failed to validate products.",
          });
        }

        const validatedItems = items.map(
          (reqItem: any) => {
            const product = products?.find(
              (product) =>
                product.id === reqItem.productId
            );

            if (!product) {
              throw new Error(
                `Product with ID ${reqItem.productId} not found.`
              );
            }

            return {
              id: product.id,
              name: product.name,
              category: product.category,
              brand: product.brand,
              model: product.model,
              partNumber: product.part_number,
              price: Number(product.price),
              showPrice: product.show_price,
              availability:
                product.availability,
              quantity:
                reqItem.quantity || 1,
            };
          }
        );

        // Generate request number
        const dateStr = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");

        const randomNum = Math.floor(
          Math.random() * 1000
        )
          .toString()
          .padStart(3, "0");

        const requestNumber = `REQ-${dateStr}-${randomNum}`;

        // Gmail SMTP
        const transporter =
          nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          });

        // Requested parts HTML
        const itemsListHtml =
          validatedItems
            .map(
              (item, index) => `
                <tr>
                  <td style="
                    padding:10px;
                    border-bottom:1px solid #ddd;
                  ">
                    ${index + 1}
                  </td>

                  <td style="
                    padding:10px;
                    border-bottom:1px solid #ddd;
                  ">
                    <strong>${item.name}</strong><br>
                    <small>
                      Part Number:
                      ${item.partNumber}
                    </small><br>
                    <small>
                      Brand:
                      ${item.brand}
                    </small><br>
                    <small>
                      Model:
                      ${item.model}
                    </small>
                  </td>

                  <td style="
                    padding:10px;
                    border-bottom:1px solid #ddd;
                    text-align:center;
                  ">
                    ${item.quantity}
                  </td>
                </tr>
              `
            )
            .join("");

        // Email
        const mailOptions = {
          from: `"${process.env.BUSINESS_NAME || "GearXpert"}" <${process.env.SMTP_USER}>`,

          to: process.env.BUSINESS_EMAIL,

          subject:
            `New Parts Request - ${requestNumber}`,

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 700px;
              margin: auto;
              padding: 25px;
              border: 1px solid #ddd;
              border-radius: 8px;
            ">

              <h2 style="
                color:#1e3a8a;
                border-bottom:2px solid #1e3a8a;
                padding-bottom:10px;
              ">
                NEW PARTS REQUEST
              </h2>

              <p>
                <strong>
                  Request Number:
                </strong>

                <span style="
                  color:#d97706;
                  font-weight:bold;
                ">
                  ${requestNumber}
                </span>
              </p>

              <p>
                <strong>
                  Submitted:
                </strong>

                ${new Date().toLocaleString(
                  "en-GB"
                )}
              </p>

              <h3 style="
                background:#f3f4f6;
                padding:10px;
              ">
                Customer Details
              </h3>

              <table style="
                width:100%;
                margin-bottom:20px;
              ">

                <tr>
                  <td style="
                    padding:5px;
                    width:130px;
                  ">
                    <strong>Name:</strong>
                  </td>

                  <td>
                    ${customer.fullName}
                  </td>
                </tr>

                <tr>
                  <td style="padding:5px;">
                    <strong>Phone:</strong>
                  </td>

                  <td>
                    <a href="tel:${customer.phone}">
                      ${customer.phone}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:5px;">
                    <strong>WhatsApp:</strong>
                  </td>

                  <td>
                    ${customer.whatsapp}
                  </td>
                </tr>

                <tr>
                  <td style="padding:5px;">
                    <strong>Location:</strong>
                  </td>

                  <td>
                    ${customer.location}
                  </td>
                </tr>

                <tr>
                  <td style="padding:5px;">
                    <strong>Address:</strong>
                  </td>

                  <td>
                    ${customer.address || "N/A"}
                  </td>
                </tr>

              </table>

              <h3 style="
                background:#f3f4f6;
                padding:10px;
              ">
                Requested Parts
              </h3>

              <table style="
                width:100%;
                border-collapse:collapse;
                margin-bottom:20px;
              ">

                <thead>
                  <tr style="
                    background:#f9fafb;
                  ">

                    <th style="
                      padding:10px;
                      text-align:left;
                    ">
                      #
                    </th>

                    <th style="
                      padding:10px;
                      text-align:left;
                    ">
                      Product Details
                    </th>

                    <th style="
                      padding:10px;
                      text-align:center;
                    ">
                      Quantity
                    </th>

                  </tr>
                </thead>

                <tbody>
                  ${itemsListHtml}
                </tbody>

              </table>

              ${
                customer.message
                  ? `
                    <h3 style="
                      background:#f3f4f6;
                      padding:10px;
                    ">
                      Customer Message
                    </h3>

                    <div style="
                      padding:15px;
                      background:#fffbeb;
                      border-left:4px solid #f59e0b;
                    ">
                      ${customer.message}
                    </div>
                  `
                  : ""
              }

              <div style="
                margin-top:30px;
                padding-top:15px;
                border-top:1px solid #eee;
                color:#777;
                font-size:12px;
              ">
                This is an automated parts request from
                ${
                  process.env.BUSINESS_NAME ||
                  "GearXpert"
                }.
              </div>

            </div>
          `,
        };

        // Send email
        await transporter.sendMail(
          mailOptions
        );

        console.log(
          `Request ${requestNumber} email sent successfully to ${process.env.BUSINESS_EMAIL}`
        );

        res.status(200).json({
          success: true,
          message:
            "Request submitted successfully",
          requestNumber,
        });
      } catch (error: any) {
        console.error(
          "Error processing request:",
          error
        );

        res.status(500).json({
          error:
            "Failed to send request. Please try again later.",
        });
      }
    }
  );

  // --------------------------------------------------
  // VITE DEVELOPMENT SERVER
  // --------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(
      process.cwd(),
      "dist"
    );

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(
        path.join(distPath, "index.html")
      );
    });
  }

  // --------------------------------------------------
  // START SERVER
  // --------------------------------------------------

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
}

startServer().catch(console.error); 