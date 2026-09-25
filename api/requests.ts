import nodemailer from "nodemailer";

import {
  getPublicSupabase,
  sendError,
} from "../src/vercelApiUtils";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { customer, items } =
      req.body || {};

    if (
      !customer ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        error:
          "Invalid request data. Customer details and items are required.",
      });
    }

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

    const productIds = items
      .map(
        (item: any) => item.productId
      )
      .filter(Boolean);

    if (productIds.length === 0) {
      return res.status(400).json({
        error: "No valid products were submitted.",
      });
    }

    const supabase =
      getPublicSupabase();

    const {
      data: products,
      error: productError,
    } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productError) {
      console.error(
        "Product validation error:",
        productError
      );

      return res.status(500).json({
        error:
          productError.message ||
          "Failed to validate products.",
      });
    }

    const validatedItems =
      productIds.map((productId: string) => {
        const requestItem =
          items.find(
            (item: any) =>
              item.productId ===
              productId
          );

        const product =
          products?.find(
            (item: any) =>
              item.id === productId
          );

        if (!product) {
          throw Object.assign(
            new Error(
              `Product with ID ${productId} not found.`
            ),
            { statusCode: 400 }
          );
        }

        const quantity =
          Math.max(
            1,
            Number(
              requestItem?.quantity || 1
            )
          );

        const price =
          Number(product.price);

        const discountPrice =
          product.discount_price !==
            null &&
          product.discount_price !==
            undefined
            ? Number(
                product.discount_price
              )
            : null;

        const hasDiscount =
          discountPrice !== null &&
          discountPrice < price;

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          model: product.model,
          partNumber:
            product.part_number,
          price,
          discountPrice,
          showPrice:
            Boolean(
              product.show_price
            ),
          availability:
            product.availability,
          quantity,
          total:
            (hasDiscount
              ? discountPrice
              : price) * quantity,
        };
      });

    const dateStr =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

    const randomNum =
      Math.floor(
        Math.random() * 1000
      )
        .toString()
        .padStart(3, "0");

    const requestNumber =
      `REQ-${dateStr}-${randomNum}`;

    const smtpUser =
      process.env.SMTP_USER;

    const smtpPassword =
      process.env.SMTP_PASSWORD;

    const businessEmail =
      process.env.BUSINESS_EMAIL;

    if (
      !smtpUser ||
      !smtpPassword ||
      !businessEmail
    ) {
      return res.status(500).json({
        error:
          "Email service is not configured on the server.",
      });
    }

    const transporter =
      nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

    const itemsHtml =
      validatedItems
        .map((item, index) => {
          const hasDiscount =
            item.discountPrice !==
              null &&
            item.discountPrice <
              item.price;

          let priceHtml = "Contact for price";

          if (item.showPrice) {
            priceHtml =
              hasDiscount
                ? `
                  <span style="text-decoration:line-through;color:#777;">
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
                `;
          }

          return `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #eee;">
                ${index + 1}
              </td>

              <td style="padding:10px;border-bottom:1px solid #eee;">
                <strong>${esc(item.name)}</strong><br>
                <span style="color:#666;">
                  ${esc(item.brand)} • ${esc(item.model)}
                </span><br>
                <span style="font-size:12px;color:#888;">
                  Part No: ${esc(item.partNumber)}
                </span>
              </td>

              <td style="padding:10px;text-align:center;border-bottom:1px solid #eee;">
                ${item.quantity}
              </td>

              <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">
                ${priceHtml}
              </td>
            </tr>
          `;
        })
        .join("");

    const businessName =
      process.env.BUSINESS_NAME ||
      "GearXpert";

    await transporter.sendMail({
      from: smtpUser,
      to: businessEmail,
      replyTo: smtpUser,
      subject:
        `New Parts Request - ${requestNumber}`,
      html: `
        <div style="
          max-width:760px;
          margin:0 auto;
          font-family:Arial,sans-serif;
          color:#222;
        ">

          <h2>
            New Parts Request
          </h2>

          <p>
            <strong>Request:</strong>
            ${esc(requestNumber)}
          </p>

          <h3 style="background:#f3f4f6;padding:10px;">
            Customer Information
          </h3>

          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px;"><strong>Name:</strong></td>
              <td style="padding:5px;">${esc(customer.fullName)}</td>
            </tr>

            <tr>
              <td style="padding:5px;"><strong>Phone:</strong></td>
              <td style="padding:5px;">${esc(customer.phone)}</td>
            </tr>

            <tr>
              <td style="padding:5px;"><strong>WhatsApp:</strong></td>
              <td style="padding:5px;">${esc(customer.whatsapp)}</td>
            </tr>

            <tr>
              <td style="padding:5px;"><strong>Location:</strong></td>
              <td style="padding:5px;">${esc(customer.location)}</td>
            </tr>

            <tr>
              <td style="padding:5px;"><strong>Address:</strong></td>
              <td style="padding:5px;">${esc(customer.address || "N/A")}</td>
            </tr>
          </table>

          <h3 style="background:#f3f4f6;padding:10px;">
            Requested Parts
          </h3>

          <table style="
            width:100%;
            border-collapse:collapse;
          ">
            <thead>
              <tr style="background:#fafafa;">
                <th style="padding:10px;text-align:left;">#</th>
                <th style="padding:10px;text-align:left;">Product</th>
                <th style="padding:10px;text-align:center;">Qty</th>
                <th style="padding:10px;text-align:right;">Price</th>
              </tr>
            </thead>

            <tbody>
              ${itemsHtml}
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
                  ${esc(customer.message)}
                </div>
              `
              : ""
          }

          <p style="
            margin-top:30px;
            padding-top:15px;
            border-top:1px solid #eee;
            color:#777;
            font-size:12px;
          ">
            This is an automated parts request from
            ${esc(businessName)}.
          </p>

        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "Request submitted successfully",
      requestNumber,
    });
  } catch (error) {
    console.error(
      "Parts request API error:",
      error
    );

    return sendError(
      res,
      error,
      "Failed to send request. Please try again later."
    );
  }
}
