const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./db');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const cartRoutes = require('./routes/cart');
const purchasesRoutes = require('./routes/purchases');
const wishlistRoutes = require('./routes/wishlist');
const ratingsRoutes = require('./routes/ratings');
const marketRoutes = require('./routes/market');
const adminRoutes = require('./routes/admin');
const pointShopRoutes = require('./routes/pointShop');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/points', pointShopRoutes);
app.use('/api/community', communityRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SteamJek API is running!' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;