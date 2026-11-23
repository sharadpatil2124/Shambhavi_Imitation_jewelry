import { Model } from '../db/model.js';

// Table: enquiries (contact form messages)
const Enquiry = Model.define('Enquiry', {
  table: 'enquiries',
  fields: {
    name: { type: 'string', required: true, trim: true },
    email: { type: 'string', required: true, trim: true, lowercase: true },
    phone: { type: 'string', trim: true },
    subject: { type: 'string', trim: true },
    message: { type: 'string', required: true }
  }
});

export default Enquiry;
