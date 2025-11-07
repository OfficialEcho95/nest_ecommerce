import crypto from "crypto";
import axios from "axios";

const PAYSTACK_SECRET_KEY = "sk_test_73bb2550bdfe2ccaf1369ea167ece47ab06d7df9"; // same as .env
const url = "http://localhost:3000/webhooks/paystack";

const payload = {
  event: "charge.success",
  data: {
    reference: "order_5_1762180178909",
    amount: 5000,
    status: "success",
  },
};

// must stringify exactly as it would come from Paystack
const rawBody = JSON.stringify(payload);

// compute signature
const signature = crypto
  .createHmac("sha512", PAYSTACK_SECRET_KEY)
  .update(rawBody)
  .digest("hex");

(async () => {
  try {
    const res = await axios.post(url, rawBody, {
      headers: {
        "x-paystack-signature": signature,
        "content-type": "application/json",
      },
    });
    console.log("✅ Response:", res.data);
  } catch (err) {
    console.error("❌ Error response:", err.response?.data || err.message);
  }
})();
