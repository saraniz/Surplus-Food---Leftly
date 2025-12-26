// // utils/payhere.js
// import crypto from 'crypto';

// // Generate PayHere hash
// export const generatePayHereHash = (merchantId, orderId, amount, currency, merchantSecret) => {
//   const hashData = merchantId + orderId + amount + currency + merchantSecret;
//   return crypto.createHash('md5').update(hashData).digest('hex').toUpperCase();
// };

// // Validate PayHere payment
// export const validatePayHerePayment = (paymentData, merchantSecret) => {
//   const {
//     merchant_id,
//     order_id,
//     payhere_amount,
//     payhere_currency,
//     status_code,
//     md5sig
//   } = paymentData;

//   // Recreate the hash
//   const localMd5sig = crypto
//     .createHash('md5')
//     .update(
//       merchant_id +
//       order_id +
//       payhere_amount +
//       payhere_currency +
//       status_code +
//       crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
//     )
//     .digest('hex')
//     .toUpperCase();

//   return localMd5sig === md5sig;
// };