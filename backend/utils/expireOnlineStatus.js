const DeliveryBoy = require('../models/DeliveryBoy');

const expireOnlineStatus = async () => {
  try {
    const now = new Date();
    
    const expiredDeliveryBoys = await DeliveryBoy.find({
      online: true,
      onlineExpiresAt: { $lt: now }
    });
    
    if (expiredDeliveryBoys.length === 0) {
      return;
    }
    
    const result = await DeliveryBoy.updateMany(
      {
        online: true,
        onlineExpiresAt: { $lt: now }
      },
      {
        $set: {
          online: false,
          status: 'offline',
          onlineExpiresAt: null
        }
      }
    );
    
    
  } catch (error) {
    console.error('Error expiring online delivery boy status:', error);
  }
};

const isOnlineStatusExpired = (deliveryBoy) => {
  if (!deliveryBoy.online || !deliveryBoy.onlineExpiresAt) {
    return false;
  }
  
  const now = new Date();
  return deliveryBoy.onlineExpiresAt < now;
};

module.exports = {
  expireOnlineStatus,
  isOnlineStatusExpired
};
