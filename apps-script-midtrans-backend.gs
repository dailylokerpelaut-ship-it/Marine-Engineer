/**
 * Daily Loker Pelaut — Midtrans Snap MVP Backend (Google Apps Script)
 *
 * Cara pakai:
 * 1. Buat Google Sheet: Orders
 * 2. Extensions > Apps Script
 * 3. Paste script ini
 * 4. Project Settings > Script Properties:
 *    - MIDTRANS_SERVER_KEY = Server Key dari Midtrans
 *    - MIDTRANS_ENV = sandbox atau production
 *    - SHEET_ID = ID Google Sheet Orders
 * 5. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy Web App URL ke checkout.html > CONFIG.CREATE_ORDER_ENDPOINT
 *
 * Catatan:
 * - Jangan taruh Server Key Midtrans di HTML/JavaScript frontend.
 * - Untuk production, pastikan Finish/Unfinish/Error URL di Midtrans diarahkan ke domain Daily Loker Pelaut.
 */

const PRODUCTS = {
  "interview-mastery-pelaut": {
    name: "Interview Mastery untuk Pelaut",
    type: "physical",
    price: 179000
  },
  "marine-engineer-book": {
    name: "Interview Mastery untuk Marine Engineer",
    type: "physical",
    price: 279000
  },
  "ai-interview-simulator": {
    name: "AI Interview Simulator",
    type: "digital",
    price: 49000
  },
  // Alias lama agar checkout lama tidak error.
  "ai-starter-pass": {
    name: "AI Interview Simulator",
    type: "digital",
    price: 49000
  }
};

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    // Frontend order creation
    if (body.action === "create_order") {
      return jsonResponse(createOrder(body.order));
    }

    // Midtrans payment notification webhook
    if (body.order_id && body.transaction_status) {
      return jsonResponse(handleMidtransNotification(body));
    }

    return jsonResponse({ success: false, message: "Unknown action." });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

function createOrder(order) {
  if (!order || !order.product_id) throw new Error("Invalid order payload.");

  const product = PRODUCTS[order.product_id];
  if (!product) throw new Error("Product not found.");

  const quantity = product.type === "physical" ? Math.max(1, Number(order.quantity || 1)) : 1;
  const grossAmount = product.price * quantity;
  const customer = order.customer || {};

  validateCustomer(product, customer);

  const orderId = generateOrderId(order.product_id);
  const itemDetails = [{
    id: order.product_id,
    price: product.price,
    quantity: quantity,
    name: product.name.substring(0, 50)
  }];

  const snapPayload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount
    },
    item_details: itemDetails,
    customer_details: {
      first_name: customer.name,
      email: customer.email || "customer@dailylokerpelaut.com",
      phone: customer.whatsapp
    },
    callbacks: {
      finish: "https://dailylokerpelaut.com/payment-success.html?order_id=" + encodeURIComponent(orderId),
      unfinish: "https://dailylokerpelaut.com/payment-pending.html?order_id=" + encodeURIComponent(orderId),
      error: "https://dailylokerpelaut.com/payment-failed.html?order_id=" + encodeURIComponent(orderId)
    },
    custom_field1: order.product_id,
    custom_field2: product.type,
    custom_field3: customer.category || ""
  };

  const snapResult = requestSnapToken(snapPayload);

  appendOrderRow({
    order_id: orderId,
    product_id: order.product_id,
    product_name: product.name,
    product_type: product.type,
    price: product.price,
    quantity: quantity,
    gross_amount: grossAmount,
    customer_name: customer.name,
    whatsapp: customer.whatsapp,
    email: customer.email || "",
    address: customer.address || "",
    notes: customer.notes || "",
    category: customer.category || "",
    payment_status: "created",
    midtrans_transaction_id: "",
    snap_token: snapResult.token || "",
    fulfillment_status: "not_sent",
    resi_or_access_code: "",
    admin_notes: ""
  });

  return {
    success: true,
    order_id: orderId,
    snap_token: snapResult.token,
    redirect_url: snapResult.redirect_url
  };
}

function validateCustomer(product, customer) {
  if (!customer.name) throw new Error("Nama wajib diisi.");
  if (!customer.whatsapp) throw new Error("Nomor WhatsApp wajib diisi.");

  if (product.type === "digital" && !customer.email) {
    throw new Error("Email wajib diisi untuk AI Interview Simulator.");
  }

  if (product.type === "physical" && (!customer.address || customer.address.length < 20)) {
    throw new Error("Alamat lengkap wajib diisi untuk pengiriman buku.");
  }
}

function requestSnapToken(payload) {
  const props = PropertiesService.getScriptProperties();
  const serverKey = props.getProperty("MIDTRANS_SERVER_KEY");
  const env = props.getProperty("MIDTRANS_ENV") || "sandbox";

  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum diisi di Script Properties.");

  const url = env === "production"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const auth = Utilities.base64Encode(serverKey + ":");

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Basic " + auth,
      Accept: "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const text = response.getContentText();
  const data = JSON.parse(text || "{}");

  if (code < 200 || code >= 300) {
    throw new Error("Midtrans error: " + text);
  }

  return data;
}

function appendOrderRow(row) {
  const sheet = getOrdersSheet();
  ensureHeader(sheet);

  sheet.appendRow([
    new Date(),
    row.order_id,
    row.product_id,
    row.product_name,
    row.product_type,
    row.price,
    row.quantity,
    row.gross_amount,
    row.customer_name,
    row.whatsapp,
    row.email,
    row.address,
    row.notes,
    row.category,
    row.payment_status,
    row.midtrans_transaction_id,
    row.snap_token,
    row.fulfillment_status,
    row.resi_or_access_code,
    row.admin_notes
  ]);
}

function handleMidtransNotification(notification) {
  const orderId = notification.order_id;
  const status = notification.transaction_status;
  const transactionId = notification.transaction_id || "";

  const sheet = getOrdersSheet();
  const values = sheet.getDataRange().getValues();
  const header = values[0];

  const orderCol = header.indexOf("Order ID");
  const statusCol = header.indexOf("Payment Status");
  const trxCol = header.indexOf("Midtrans Transaction ID");

  for (let i = 1; i < values.length; i++) {
    if (values[i][orderCol] === orderId) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      if (trxCol >= 0) sheet.getRange(i + 1, trxCol + 1).setValue(transactionId);
      return { success: true, message: "Order status updated.", order_id: orderId, status: status };
    }
  }

  return { success: false, message: "Order ID not found.", order_id: orderId };
}

function getOrdersSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("SHEET_ID");
  if (!sheetId) throw new Error("SHEET_ID belum diisi di Script Properties.");

  const ss = SpreadsheetApp.openById(sheetId);
  return ss.getSheetByName("Orders") || ss.insertSheet("Orders");
}

function ensureHeader(sheet) {
  const header = [
    "Timestamp",
    "Order ID",
    "Product ID",
    "Product Name",
    "Product Type",
    "Price",
    "Quantity",
    "Gross Amount",
    "Customer Name",
    "WhatsApp",
    "Email",
    "Address",
    "Notes",
    "Category",
    "Payment Status",
    "Midtrans Transaction ID",
    "Snap Token",
    "Fulfillment Status",
    "Resi / Access Code",
    "Admin Notes"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
    return;
  }

  const existing = sheet.getRange(1, 1, 1, header.length).getValues()[0];
  if (existing.join("") === "") {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

function generateOrderId(productId) {
  const prefix = (productId === "ai-interview-simulator" || productId === "ai-starter-pass") ? "DLP-AI" : "DLP-BOOK";
  const tz = "Asia/Jakarta";
  const date = Utilities.formatDate(new Date(), tz, "yyyyMMdd-HHmmss");
  const random = Math.floor(Math.random() * 900 + 100);
  return prefix + "-" + date + "-" + random;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
