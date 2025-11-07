import crypto from "crypto";

const secret = "sk_test_73bb2550bdfe2ccaf1369ea167ece47ab06d7df9"; // your real Paystack secret key

// your raw JSON (must match the exact body you’ll send in Thunder Client)
const rawBody = JSON.stringify({
  event: "charge.success",
  data: {
    reference: "order_5_1762180178909",
    status: "success",
  },
});

const signature = crypto
  .createHmac("sha512", secret)
  .update(rawBody)
  .digest("hex");

console.log("x-paystack-signature:", signature);
