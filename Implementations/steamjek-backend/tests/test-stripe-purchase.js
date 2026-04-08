require('dotenv').config({ path: require("node:path").resolve(__dirname, '../.env') });
const stripe = require('../config/stripe');

async function testPurchase() {
    console.log('--- Starting Stripe Purchase Test ---');
    const API_URL = 'http://localhost:3000/api';
    let token;

    try {
        // 1. Login to get token
        console.log('1. Logging in as test user...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        
        if (!loginRes.ok) {
            console.error('Failed to login. Please ensure the test user exists.');
            return;
        }
        
        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('   Login successful.');

        // 2. Add item to cart
        console.log('2. Adding Game ID 1 to cart...');
        const cartRes = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ game_id: 1 })
        });
        const cartText = await cartRes.text();
        console.log(`   Cart Add Status: ${cartRes.status} - ${cartText}`);

        // 3. Create Payment Intent
        console.log('3. Initiating checkout (create payment intent)...');
        const piRes = await fetch(`${API_URL}/purchases/create-payment-intent`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!piRes.ok) {
            const error = await piRes.text();
            console.error(`   Failed to create payment intent: ${error}`);
            return;
        }

        const piData = await piRes.json();
        console.log(`   Payment Intent Created!`);
        console.log(`   Client Secret: ${piData.clientSecret.substring(0, 15)}...`);
        console.log(`   Total Amount: $${piData.amount}`);
        
        const paymentIntentId = piData.clientSecret.split('_secret_')[0];

        // 4. Simulate Stripe Processing (Mock Success)
        console.log('4. Simulating successful Stripe payment processing...');
        // We will update the payment intent status directly via Stripe SDK for testing
        // Usually, the frontend Elements does this automatically when the user clicks 'Pay'
        try {
            await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: 'pm_card_visa' // Built-in Stripe test card
            });
            console.log('   Stripe payment confirmed successfully.');
        } catch (e) {
            console.error('   Error confirming with Stripe (Normal if test mode):', e.message);
            // If it fails here, it's usually because the pm_card_visa requires frontend customer action or the key is wrong.
            // We will still try the backend confirm just in case.
        }

        // 5. Confirm Purchase with Backend
        console.log('5. Finalizing purchase on backend...');
        const confirmRes = await fetch(`${API_URL}/purchases/confirm`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payment_intent_id: paymentIntentId })
        });

        if (confirmRes.ok) {
            const confirmData = await confirmRes.json();
            console.log('\n✅ Purchase Flow Completed Successfully!');
            console.log(confirmData);
        } else {
            const errorData = await confirmRes.json();
            console.error('\n❌ Purchase flow failed at backend confirmation.');
            console.error(errorData);
        }

    } catch (err) {
        console.error('Test Encountered an Error:', err);
    }
}

testPurchase();
