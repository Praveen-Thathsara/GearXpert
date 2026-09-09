import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import "dotenv/config";

const products = [
  { id: "1", name: "Honda Dio Front Brake Pad", category: "Brake Parts", brand: "Honda", model: "Dio", partNumber: "BP-DIO-001", price: 1500, showPrice: true, availability: "In Stock" },
  { id: "2", name: "Honda CD70 Chain Set", category: "Chain & Sprocket", brand: "Honda", model: "CD70", partNumber: "CS-CD70-001", price: 4500, showPrice: true, availability: "In Stock" },
  { id: "3", name: "Yamaha FZ Air Filter", category: "Filters", brand: "Yamaha", model: "FZ", partNumber: "AF-FZ-001", price: 800, showPrice: true, availability: "In Stock" },
  { id: "4", name: "Bajaj Pulsar Brake Pad", category: "Brake Parts", brand: "Bajaj", model: "Pulsar", partNumber: "BP-PUL-001", price: 1200, showPrice: false, availability: "Limited Stock" },
  { id: "5", name: "TVS Apache Oil Filter", category: "Filters", brand: "TVS", model: "Apache", partNumber: "OF-APA-001", price: 650, showPrice: true, availability: "In Stock" },
  { id: "6", name: "Honda Dio Air Filter", category: "Filters", brand: "Honda", model: "Dio", partNumber: "AF-DIO-001", price: 750, showPrice: true, availability: "In Stock" },
  { id: "7", name: "Honda CD70 Brake Shoe", category: "Brake Parts", brand: "Honda", model: "CD70", partNumber: "BS-CD70-001", price: 900, showPrice: true, availability: "In Stock" },
  { id: "8", name: "Yamaha FZ Brake Pad", category: "Brake Parts", brand: "Yamaha", model: "FZ", partNumber: "BP-FZ-001", price: 1300, showPrice: true, availability: "Out of Stock" },
  { id: "9", name: "Honda Hornet Headlight Bulb", category: "Electrical", brand: "Honda", model: "Hornet", partNumber: "HL-HRT-001", price: 1800, showPrice: true, availability: "In Stock" },
  { id: "10", name: "Yamaha R15 Front Fender", category: "Body Parts", brand: "Yamaha", model: "R15", partNumber: "FF-R15-001", price: 5500, showPrice: false, availability: "Pre-order" },
  { id: "11", name: "Bajaj Pulsar Spark Plug", category: "Engine Parts", brand: "Bajaj", model: "Pulsar", partNumber: "SP-PUL-001", price: 450, showPrice: true, availability: "In Stock" },
  { id: "12", name: "TVS Apache Rear Shock Absorber", category: "Suspension", brand: "TVS", model: "Apache", partNumber: "SA-APA-001", price: 8500, showPrice: false, availability: "Limited Stock" },
  { id: "13", name: "Honda Dio Battery 12V 4Ah", category: "Electrical", brand: "Honda", model: "Dio", partNumber: "BAT-DIO-001", price: 4200, showPrice: true, availability: "In Stock" },
  { id: "14", name: "Yamaha FZ Clutch Cable", category: "Engine Parts", brand: "Yamaha", model: "FZ", partNumber: "CC-FZ-001", price: 600, showPrice: true, availability: "In Stock" },
  { id: "15", name: "Honda CD70 Carburetor", category: "Engine Parts", brand: "Honda", model: "CD70", partNumber: "CARB-CD70-001", price: 3500, showPrice: false, availability: "In Stock" },
  { id: "16", name: "Bajaj Pulsar Chain Sprocket Kit", category: "Chain & Sprocket", brand: "Bajaj", model: "Pulsar", partNumber: "CS-PUL-001", price: 5200, showPrice: true, availability: "In Stock" },
  { id: "17", name: "TVS Apache Indicator Set", category: "Electrical", brand: "TVS", model: "Apache", partNumber: "IND-APA-001", price: 1200, showPrice: true, availability: "In Stock" },
  { id: "18", name: "Yamaha R15 Side Mirror", category: "Accessories", brand: "Yamaha", model: "R15", partNumber: "SM-R15-001", price: 2100, showPrice: true, availability: "Limited Stock" },
  { id: "19", name: "Honda Hornet Engine Oil 1L", category: "Engine Parts", brand: "Honda", model: "Hornet", partNumber: "OIL-HRT-001", price: 2800, showPrice: true, availability: "In Stock" },
  { id: "20", name: "Universal LED Tail Light", category: "Electrical", brand: "Universal", model: "All", partNumber: "TL-UNV-001", price: 1500, showPrice: true, availability: "In Stock" },
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

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
    message: "Too many requests from this IP, please try again after 15 minutes.",
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/products", (req, res) => {
    res.json(products);
  });

  app.post("/api/requests", apiLimiter, async (req, res) => {
    try {
      const { customer, items } = req.body;

      if (!customer || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: "Invalid request data. Customer details and items are required.",
        });
      }

      if (
        !customer.fullName ||
        !customer.phone ||
        !customer.whatsapp ||
        !customer.location
      ) {
        return res.status(400).json({
          error: "Missing required customer details.",
        });
      }

      const validatedItems = items.map((reqItem: any) => {
        const product = products.find(
          (product) => product.id === reqItem.productId
        );

        if (!product) {
          throw new Error(
            `Product with ID ${reqItem.productId} not found.`
          );
        }

        return {
          ...product,
          quantity: reqItem.quantity || 1,
        };
      });

      const dateStr = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

      const randomNum = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");

      const requestNumber = `REQ-${dateStr}-${randomNum}`;

      // Gmail SMTP
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const itemsListHtml = validatedItems
        .map(
          (item, index) => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #ddd;">
                ${index + 1}
              </td>

              <td style="padding:10px;border-bottom:1px solid #ddd;">
                <strong>${item.name}</strong><br>
                <small>Part Number: ${item.partNumber}</small><br>
                <small>Brand: ${item.brand}</small><br>
                <small>Model: ${item.model}</small>
              </td>

              <td style="padding:10px;border-bottom:1px solid #ddd;text-align:center;">
                ${item.quantity}
              </td>
            </tr>
          `
        )
        .join("");

      const mailOptions = {
        from: `"${process.env.BUSINESS_NAME || "GearXpert"}" <${process.env.SMTP_USER}>`,

        to: process.env.BUSINESS_EMAIL,

        replyTo: customer.email || undefined,

        subject: `New Parts Request - ${requestNumber}`,

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
              <strong>Request Number:</strong>
              <span style="color:#d97706;font-weight:bold;">
                ${requestNumber}
              </span>
            </p>

            <p>
              <strong>Submitted:</strong>
              ${new Date().toLocaleString("en-GB")}
            </p>

            <h3 style="background:#f3f4f6;padding:10px;">
              Customer Details
            </h3>

            <table style="width:100%;margin-bottom:20px;">
              <tr>
                <td style="padding:5px;width:130px;">
                  <strong>Name:</strong>
                </td>
                <td>${customer.fullName}</td>
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
                <td>${customer.whatsapp}</td>
              </tr>

              <tr>
                <td style="padding:5px;">
                  <strong>Email:</strong>
                </td>
                <td>
                  ${
                    customer.email
                      ? `<a href="mailto:${customer.email}">
                          ${customer.email}
                         </a>`
                      : "N/A"
                  }
                </td>
              </tr>

              <tr>
                <td style="padding:5px;">
                  <strong>Location:</strong>
                </td>
                <td>${customer.location}</td>
              </tr>

              <tr>
                <td style="padding:5px;">
                  <strong>Address:</strong>
                </td>
                <td>${customer.address || "N/A"}</td>
              </tr>
            </table>

            <h3 style="background:#f3f4f6;padding:10px;">
              Requested Parts
            </h3>

            <table style="
              width:100%;
              border-collapse:collapse;
              margin-bottom:20px;
            ">

              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px;text-align:left;">
                    #
                  </th>

                  <th style="padding:10px;text-align:left;">
                    Product Details
                  </th>

                  <th style="padding:10px;text-align:center;">
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
                  <h3 style="background:#f3f4f6;padding:10px;">
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
              This is an automated parts request from ${process.env.BUSINESS_NAME || "GearXpert"}.
            </div>

          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      console.log(
        `Request ${requestNumber} email sent successfully to ${process.env.BUSINESS_EMAIL}`
      );

      res.status(200).json({
        success: true,
        message: "Request submitted successfully",
        requestNumber,
      });

    } catch (error: any) {
      console.error("Error processing request:", error);

      res.status(500).json({
        error: "Failed to send request. Please try again later.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);