const getHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School ERP API is running',
  });
};

module.exports = { getHealth };
