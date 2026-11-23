import { Model } from '../db/model.js';

// Table: banners
const Banner = Model.define('Banner', {
  table: 'banners',
  fields: {
    title: { type: 'string', required: 'Please specify the banner title', trim: true },
    subtitle: { type: 'string', trim: true },
    image: { type: 'string', required: 'Please upload a banner graphic asset' }, // high-res banner URL
    link: { type: 'string', default: '/shop' }, // Click navigation link path
    isActive: { type: 'boolean', default: true }
  }
});

export default Banner;
