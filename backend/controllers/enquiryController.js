import Enquiry from '../models/Enquiry.js';

// @desc    Submit an enquiry message
// @route   POST /api/enquiries
// @access  Public
export const createEnquiry = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400);
      throw new Error('Please enter all required fields (name, email, and message)');
    }

    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      message: '✨ Your enquiry has been successfully transmitted to our luxury concierge. We will respond within 12 hours!',
      enquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private/Admin
export const getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      enquiries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private/Admin
export const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      res.status(404);
      throw new Error('Enquiry not found');
    }

    await enquiry.deleteOne();

    res.json({
      success: true,
      message: 'Enquiry entry removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
