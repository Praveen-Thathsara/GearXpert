import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import "dotenv/config";
import { supabase } from "./src/supabaseServer";


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
        console.error("Error fetching products:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return res.status(500).json({
          error: error.message || "Failed to fetch products",
        });
      }

      const products = data.map((product) => {

        const imageUrls =
          Array.isArray(product.image_urls)
            ? product.image_urls.filter(
              (url: unknown): url is string =>
                typeof url === "string" &&
                url.trim().length > 0
            )
            : product.image_url
              ? [product.image_url]
              : [];

        return {
          id: product.id,

          name: product.name,
          category: product.category,
          brand: product.brand,
          model: product.model,
          partNumber: product.part_number,

          price: Number(product.price),

          discountPrice:
            product.discount_price !== null &&
              product.discount_price !== undefined
              ? Number(product.discount_price)
              : null,

          showPrice:
            product.show_price,

          availability:
            product.availability,

          // Main image
          imageUrl:
            imageUrls[0] || null,

          // All images
          imageUrls,
        };
      });

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
          discountPrice,
          showPrice,
          availability,
          imageUrl,
          imageUrls,
        } = req.body;

        // ----------------------------------------------
        // REQUIRED FIELDS
        // ----------------------------------------------

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

        // ----------------------------------------------
        // PRICE
        // ----------------------------------------------

        const originalPrice = Number(price) || 0;

        if (originalPrice < 0) {
          return res.status(400).json({
            error: "Original price cannot be negative.",
          });
        }

        // ----------------------------------------------
        // DISCOUNT PRICE
        // ----------------------------------------------

        const finalDiscountPrice =
          discountPrice === null ||
            discountPrice === undefined ||
            discountPrice === ""
            ? null
            : Number(discountPrice);

        // Check valid number
        if (
          finalDiscountPrice !== null &&
          (Number.isNaN(finalDiscountPrice) ||
            finalDiscountPrice < 0)
        ) {
          return res.status(400).json({
            error: "Discount price must be a valid positive number.",
          });
        }

        // Discount must be lower than original price
        if (
          finalDiscountPrice !== null &&
          finalDiscountPrice >= originalPrice
        ) {
          return res.status(400).json({
            error:
              "Discount price must be lower than the original price.",
          });
        }

        // ----------------------------------------------
        // INSERT PRODUCT INTO SUPABASE
        // ----------------------------------------------

        const finalImageUrls = Array.isArray(imageUrls)
          ? imageUrls.filter(
            (url: unknown): url is string =>
              typeof url === "string" &&
              url.trim().length > 0
          )
          : imageUrl
            ? [imageUrl]
            : [];

        const { data, error } = await supabase
          .from("products")
          .insert({
            name,
            category,
            brand,
            model,
            part_number: partNumber,

            price:
              Number(price) || 0,

            discount_price:
              discountPrice === null ||
                discountPrice === undefined ||
                discountPrice === ""
                ? null
                : Number(discountPrice),

            show_price:
              typeof showPrice === "boolean"
                ? showPrice
                : true,

            availability:
              availability || "In Stock",

            image_url:
              finalImageUrls[0] || null,

            image_urls:
              finalImageUrls,
          })
          .select()
          .single();

        if (error) {
          console.error("Add product error:", error);

          return res.status(500).json({
            error: "Failed to add product.",
          });
        }

        // ----------------------------------------------
        // RESPONSE
        // ----------------------------------------------

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

            discountPrice:
              data.discount_price !== null &&
                data.discount_price !== undefined
                ? Number(data.discount_price)
                : null,

            showPrice: data.show_price,
            availability: data.availability,
            imageUrl: data.image_url || null,
            imageUrls: Array.isArray(data.image_urls)
              ? data.image_urls
              : data.image_url
                ? [data.image_url]
                : [],
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
          discountPrice,
          showPrice,
          availability,
          imageUrl,
          imageUrls,
        } = req.body;

        // ----------------------------------------------
        // REQUIRED FIELDS
        // ----------------------------------------------

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

        // ----------------------------------------------
        // PRICE
        // ----------------------------------------------

        const originalPrice = Number(price) || 0;

        if (originalPrice < 0) {
          return res.status(400).json({
            error: "Original price cannot be negative.",
          });
        }

        // ----------------------------------------------
        // DISCOUNT PRICE
        // ----------------------------------------------

        const finalDiscountPrice =
          discountPrice === null ||
            discountPrice === undefined ||
            discountPrice === ""
            ? null
            : Number(discountPrice);

        // Check valid number
        if (
          finalDiscountPrice !== null &&
          (Number.isNaN(finalDiscountPrice) ||
            finalDiscountPrice < 0)
        ) {
          return res.status(400).json({
            error: "Discount price must be a valid positive number.",
          });
        }

        // Discount must be lower than original price
        if (
          finalDiscountPrice !== null &&
          finalDiscountPrice >= originalPrice
        ) {
          return res.status(400).json({
            error:
              "Discount price must be lower than the original price.",
          });
        }

        

        // ----------------------------------------------
        // PREPARE PRODUCT IMAGES
        // ----------------------------------------------

        const finalImageUrls = Array.isArray(imageUrls)
          ? imageUrls.filter(
              (url: unknown): url is string =>
                typeof url === "string" &&
                url.trim().length > 0
            )
          : imageUrl
            ? [imageUrl]
            : [];

        // ----------------------------------------------
        // UPDATE PRODUCT
        // ----------------------------------------------

        const { data, error } = await supabase
          .from("products")
          .update({
            name,
            category,
            brand,
            model,
            part_number: partNumber,

            price:
              originalPrice,

            discount_price:
              finalDiscountPrice,

            show_price:
              typeof showPrice === "boolean"
                ? showPrice
                : true,

            availability:
              availability || "In Stock",

            image_url:
              finalImageUrls[0] || null,

            image_urls:
              finalImageUrls,
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

        // ----------------------------------------------
        // RESPONSE
        // ----------------------------------------------

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

            discountPrice:
              data.discount_price !== null &&
                data.discount_price !== undefined
                ? Number(data.discount_price)
                : null,

            showPrice: data.show_price,
            availability: data.availability,
            imageUrl: data.image_url || null,
            imageUrls: Array.isArray(data.image_urls)
              ? data.image_urls
              : data.image_url
                ? [data.image_url]
                : [],
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

        // ----------------------------------------------
        // VALIDATE REQUEST
        // ----------------------------------------------

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

        // ----------------------------------------------
        // REQUIRED CUSTOMER INFORMATION
        // ----------------------------------------------

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

        // ----------------------------------------------
        // GET PRODUCTS FROM SUPABASE
        // ----------------------------------------------

        const productIds = items.map(
          (item: any) => item.productId
        );

        const {
          data: products,
          error,
        } = await supabase
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

        // ----------------------------------------------
        // VALIDATE PRODUCTS
        // ----------------------------------------------

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

              // Original price
              price: Number(product.price),

              // Discount price
              discountPrice:
                product.discount_price !== null &&
                  product.discount_price !== undefined
                  ? Number(product.discount_price)
                  : null,

              showPrice: product.show_price,

              availability:
                product.availability,

              quantity:
                reqItem.quantity || 1,
            };
          }
        );

        // ----------------------------------------------
        // GENERATE REQUEST NUMBER
        // ----------------------------------------------

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

        // ----------------------------------------------
        // GMAIL SMTP
        // ----------------------------------------------

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

        // ----------------------------------------------
        // REQUESTED PARTS HTML
        // ----------------------------------------------

        const itemsListHtml =
          validatedItems
            .map(
              (item, index) => {
                const hasDiscount =
                  item.discountPrice !== null &&
                  item.discountPrice !== undefined &&
                  item.discountPrice < item.price;

                const priceHtml = item.showPrice
                  ? hasDiscount
                    ? `
                      <span style="
                        color:#777;
                        text-decoration:line-through;
                      ">
                        Rs. ${item.price.toLocaleString()}
                      </span>
                      <br>
                      <strong style="color:#16a34a;">
                        Rs. ${item.discountPrice!.toLocaleString()}
                      </strong>
                    `
                    : `
                      <strong>
                        Rs. ${item.price.toLocaleString()}
                      </strong>
                    `
                  : "Contact Price";

                return `
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

                    <td style="
                      padding:10px;
                      border-bottom:1px solid #ddd;
                      text-align:right;
                    ">
                      ${priceHtml}
                    </td>
                  </tr>
                `;
              }
            )
            .join("");

        // ----------------------------------------------
        // EMAIL
        // ----------------------------------------------

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

                    <th style="
                      padding:10px;
                      text-align:right;
                    ">
                      Price
                    </th>

                  </tr>
                </thead>

                <tbody>
                  ${itemsListHtml}
                </tbody>

              </table>

              ${customer.message
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
                ${process.env.BUSINESS_NAME ||
            "GearXpert"
            }.
              </div>

            </div>
          `,
        };

        // ----------------------------------------------
        // SEND EMAIL
        // ----------------------------------------------

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