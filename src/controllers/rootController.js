// Handle request to root
const handleRoot = (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Learn Express.js API",
    data: null,
  });
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: "Health Check is OK! ✅",
    data: null,
  });
};

module.exports = {
  handleRoot,
  healthCheck,
};

