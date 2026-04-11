const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("👆 Scan this QR for WhatsApp");
});

client.on('ready', () => {
    console.log('✅ DINEFLOW WhatsApp Bot is Ready!');
});

client.initialize();

const sendWhatsAppBill = async (mobileNumber, customerName, amount) => {
    try {
        // 1. Check if client is actually ready
        if (!client.info || !client.info.wid) {
            console.error("❌ Client is not ready yet. Please wait.");
            return;
        }

        // 2. Clean the Number
        const cleanNumber = mobileNumber.toString().replace(/\D/g, ''); 
        
        // 3. Ensure it has 91 and correct format
        const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
        const chatId = `${finalNumber}@c.us`;

        const name = customerName !== "Walk-in Customer" ? customerName : "Guest";
        const message = `*Thank you for visiting DineFlow!* 🍽️\n\nHi ${name},\nYour payment of *₹${amount}* has been received successfully.\n\nHope you enjoyed the food. See you again! 😊`;

        // 4. Use sendMessage directly (Avoid getChat if not needed)
        await client.sendMessage(chatId, message);
        console.log(`✅ Message sent to ${finalNumber}`);

    } catch (error) {
        console.error("❌ Failed to send WhatsApp message:", error.message);
    }
};

module.exports = { sendWhatsAppBill };