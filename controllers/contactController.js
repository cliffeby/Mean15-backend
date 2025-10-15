// controllers/contactController.js
const sendResponse = (res, status, message) => {
    res.status(status).json({ message });
  };
  
  exports.submitContact = async (req, res, next) => {
    try {
      const { name, email, message } = req.body;
  
      if (!name || !email || !message) {
        return sendResponse(res, 400, "All fields are required");
      }
  
      // For demo: simply log to console (you can integrate DB or email service later)
      console.log("New Contact Message:", { name, email, message });
  
      sendResponse(res, 200, "Message received successfully");
    } catch (error) {
      next(error);
    }
  };
  