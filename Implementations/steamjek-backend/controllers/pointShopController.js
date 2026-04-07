const pool = require('../db');

// GET /api/points — user's current point balance
const getPoints = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query('SELECT points FROM users WHERE id = $1', [user_id]);
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ points: result.rows[0].points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/points/rewards — all rewards with per-user redemption/equip state
const getRewards = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT pr.*,
              ur.id          AS user_reward_id,
              ur.is_equipped,
              (ur.id IS NOT NULL) AS is_redeemed
       FROM point_rewards pr
       LEFT JOIN user_rewards ur
              ON pr.id = ur.reward_id AND ur.user_id = $1
       ORDER BY pr.type, pr.cost`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/points/redeem/:rewardId
const redeemReward = async (req, res) => {
  const user_id = req.user.id;
  const reward_id = parseInt(req.params.rewardId);
  try {
    // Fetch reward cost
    const rewardRes = await pool.query('SELECT * FROM point_rewards WHERE id = $1', [reward_id]);
    if (!rewardRes.rows.length) return res.status(404).json({ message: 'Reward not found' });
    const reward = rewardRes.rows[0];

    // Fetch user points
    const userRes = await pool.query('SELECT points FROM users WHERE id = $1', [user_id]);
    const { points } = userRes.rows[0];

    if (points < reward.cost) return res.status(400).json({ message: 'Insufficient points' });

    // Check already redeemed
    const existingRes = await pool.query(
      'SELECT id FROM user_rewards WHERE user_id=$1 AND reward_id=$2',
      [user_id, reward_id]
    );
    if (existingRes.rows.length) return res.status(409).json({ message: 'Already redeemed' });

    // Deduct points & insert
    await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [reward.cost, user_id]);
    await pool.query(
      'INSERT INTO user_rewards (user_id, reward_id) VALUES ($1, $2)',
      [user_id, reward_id]
    );

    res.status(201).json({ message: 'Reward redeemed!', points_spent: reward.cost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/points/equip/:rewardId — toggle equip (unequip others of same type)
const equipReward = async (req, res) => {
  const user_id = req.user.id;
  const reward_id = parseInt(req.params.rewardId);
  try {
    // Find user_reward entry
    const urRes = await pool.query(
      `SELECT ur.*, pr.type
       FROM user_rewards ur
       JOIN point_rewards pr ON pr.id = ur.reward_id
       WHERE ur.user_id=$1 AND ur.reward_id=$2`,
      [user_id, reward_id]
    );
    if (!urRes.rows.length) return res.status(404).json({ message: 'You have not redeemed this reward' });
    const ur = urRes.rows[0];

    if (ur.is_equipped) {
      // Unequip
      await pool.query('UPDATE user_rewards SET is_equipped=FALSE WHERE id=$1', [ur.id]);
      return res.json({ message: 'Unequipped', is_equipped: false });
    } else {
      // Unequip all others of same type, then equip this one
      await pool.query(
        `UPDATE user_rewards SET is_equipped=FALSE
         WHERE user_id=$1
           AND reward_id IN (
             SELECT id FROM point_rewards WHERE type=$2
           )`,
        [user_id, ur.type]
      );
      await pool.query('UPDATE user_rewards SET is_equipped=TRUE WHERE id=$1', [ur.id]);
      return res.json({ message: 'Equipped', is_equipped: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/points/my-rewards — all rewards the user has redeemed
const getMyRewards = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT pr.*, ur.is_equipped, ur.redeemed_at
       FROM user_rewards ur
       JOIN point_rewards pr ON pr.id = ur.reward_id
       WHERE ur.user_id = $1
       ORDER BY ur.redeemed_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPoints, getRewards, redeemReward, equipReward, getMyRewards };
