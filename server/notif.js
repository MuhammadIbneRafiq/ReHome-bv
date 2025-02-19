// // const sdk = require('node-appwrite');
// import dotenv from "dotenv";
// dotenv.config();
// import { Client, Messaging, ID } from "node-appwrite"
// let clnt = new Client();

// clnt
//     .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
//     .setProject(process.env.PROJECT_ID_NOTIF) // Your project ID
//     .setKey(process.env.API_KEY_APPWRITE) // Your secret API key
//     // .setSelfSigned() // Use only/ on dev mode with a self-signed SSL cert
// ;

// const messaging = new Messaging(clnt)

// export const sendEmail = async () => {
//     const message = await messaging.createEmail(
//         ID.unique(), // Message ID, just a random UUID
//         '(URGENT) BOOKING MAKDE!', // subject
//         'Yo theres a booking on the ITEM/HOUSE MOVING!: ' + ID.unique(), //MESSg content
//         [], // topics (optional but keep it blank or else we gonna get error like that stripe api endpoint setup thingy)
//         ['66ba6ccf000431b2aa31', '67b60b930011213911b6'], //user of email receiver from appwrite, both of us.

//     )
//     console.log('mesg', message)
// }


// // Call the function if this file is executed directly
// if (import.meta.url === new URL(import.meta.url).href) {
//     sendEmail().then(() => {
//         console.log('Email sent successfully!');
//         process.exit(0);
//     }).catch((error) => {
//         console.error('Error sending email:', error);
//         process.exit(1);
//     });
// }
