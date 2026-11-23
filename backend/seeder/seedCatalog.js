import dotenv from 'dotenv';
import { closeDB, describeDbError } from '../config/db.js';
import { prepareDatabase } from '../db/migrate.js';
import Category from '../models/Category.js';

dotenv.config();

const categoriesData = [
  {
    name: "Bridal Collection",
    description: "Complete majestic chokers, necklaces, maang tikkas, and jhumkas meticulously set with heavy Kundan stones, high-grade synthetic pearls, and elaborate antique gold finishes.",
    image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Necklaces",
    description: "Timeless temple Kasu Malas, stone studded Harams, heavy chokers, and delicate necklaces representing South-Indian and Mughal artistry plated in pure gold leaf.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Earrings",
    description: "Gorgeous Indian bell Jhumkas, heavy American Diamond chandeliers, cocktail stone drop-earrings, and delicate traditional studs designed to sparkle bright.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Bangles",
    description: "Elegant Kada bangles with floral filigree work, screw-lock temple cuffs, and delicate cubic zirconia payals/anklets that chime with grace.",
    image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Rings",
    description: "Breath-taking lab-created Emerald rings, Ruby solitaires, and diamond-cut cubic zirconia bands constructed with standard adjustable sizes.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"
  }
];

const seedCatalog = async () => {
  console.log('Connecting to database for catalog seeding...');
  try {
    await prepareDatabase();
    console.log('✅ Connected to MySQL successfully.');

    for (const catData of categoriesData) {
      const exists = await Category.findOne({ name: catData.name });
      if (!exists) {
        await Category.create(catData);
        console.log(`✅ Created category: ${catData.name}`);
      } else {
        console.log(`ℹ️ Category already exists: ${catData.name}`);
      }
    }

    console.log('🎉 Catalog seeding completed successfully!');
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed with error:', describeDbError(error));
    await closeDB().catch(() => {});
    process.exit(1);
  }
};

seedCatalog();
