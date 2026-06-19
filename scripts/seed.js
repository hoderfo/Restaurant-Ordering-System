const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function ensureMenuItem(data) {
  const existing = await prisma.menuItem.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.menuItem.update({
      where: { id: existing.id },
      data
    });
  }
  return prisma.menuItem.create({ data });
}

async function main() {
  try {
    console.log('Creating users...');

    // Hash password once (password123)
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      }
    });

    const manager1 = await prisma.user.upsert({
      where: { username: 'manager1' },
      update: {},
      create: {
        username: 'manager1',
        password: hashedPassword,
        role: 'management'
      }
    });

    const floor1 = await prisma.user.upsert({
      where: { username: 'floor1' },
      update: {},
      create: {
        username: 'floor1',
        password: hashedPassword,
        role: 'floor'
      }
    });

    const floor2 = await prisma.user.upsert({
      where: { username: 'floor2' },
      update: {},
      create: {
        username: 'floor2',
        password: hashedPassword,
        role: 'floor'
      }
    });

    const kitchen1 = await prisma.user.upsert({
      where: { username: 'kitchen1' },
      update: {},
      create: {
        username: 'kitchen1',
        password: hashedPassword,
        role: 'kitchen'
      }
    });

    const kitchen2 = await prisma.user.upsert({
      where: { username: 'kitchen2' },
      update: {},
      create: {
        username: 'kitchen2',
        password: hashedPassword,
        role: 'kitchen'
      }
    });

    console.log('Users created:', [admin, manager1, floor1, floor2, kitchen1, kitchen2].map(u => u.username).join(', '));

    console.log('Creating tables...');

    const tables = await Promise.all([
      prisma.table.upsert({
        where: { label: 'T1' },
        update: {},
        create: { label: 'T1', capacity: 2, status: 'AVAILABLE' }
      }),
      prisma.table.upsert({
        where: { label: 'T2' },
        update: {},
        create: { label: 'T2', capacity: 2, status: 'AVAILABLE' }
      }),
      prisma.table.upsert({
        where: { label: 'T3' },
        update: {},
        create: { label: 'T3', capacity: 4, status: 'AVAILABLE' }
      }),
      prisma.table.upsert({
        where: { label: 'T4' },
        update: {},
        create: { label: 'T4', capacity: 4, status: 'AVAILABLE' }
      }),
      prisma.table.upsert({
        where: { label: 'T5' },
        update: {},
        create: { label: 'T5', capacity: 6, status: 'AVAILABLE' }
      }),
      prisma.table.upsert({
        where: { label: 'T6' },
        update: {},
        create: { label: 'T6', capacity: 6, status: 'AVAILABLE' }
      }),
      prisma.table.upsert({
        where: { label: 'T7' },
        update: {},
        create: { label: 'T7', capacity: 8, status: 'AVAILABLE' }
      }),
      prisma.table.upsert({
        where: { label: 'T8' },
        update: {},
        create: { label: 'T8', capacity: 8, status: 'AVAILABLE' }
      })
    ]);

    console.log('Tables created:', tables.map(t => t.label).join(', '));

    console.log('Creating menu items...');

    const menuItemData = [
      { name: 'Foie Gras au Torchon', description: 'Smooth duck liver terrine served with a seasonal fruit compote and toasted brioche', price: 8.50, category: 'STARTER', status: 'ACTIVE', imageUrl: 'https://i.pinimg.com/736x/ac/af/15/acaf15b439f61c7b94dadd2aaa1c2133.jpg' },
      { name: 'Wagyu Beef Tartare', description: 'Hand-cut premium Wagyu mixed with capers, shallots, cornichons, and a cured egg yolk', price: 7.00, category: 'STARTER', status: 'ACTIVE', imageUrl: 'https://domainedrouhin.com/wp-content/uploads/2020/04/Steak-Tartare-1024x700.jpg' },
      { name: 'Pan-seared Scallops', description: 'Pan-seared scallops served with a velvety cauliflower puree, a drizzle of brown butter sage sauce, and crispy pancetta', price: 9.50, category: 'STARTER', status: 'ACTIVE', imageUrl: 'https://cdn.shopify.com/s/files/1/2400/9633/files/searedscallops-hero.jpg?v=1588636263' },
      { name: 'A5 Japanese Wagyu Striploin', description: 'Wagyu striploin served alongside a rich demi-glace, truffled potato mousseline, and charred seasonal wild mushrooms', price: 12.00, category: 'MAIN', status: 'ACTIVE', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMF8_ZpiLr9yMCGDgSEB4j_3jzjac7vnzdZAQf3hQuGi-7g6FzoAqlINj3&s=10' },
      { name: 'Herb-crusted Rack of Lamb', description: 'Roasted to a perfect medium-rare, crusted with Dijon mustard and fresh herbs, served with a red wine reduction and roasted root vegetables', price: 11.50, category: 'MAIN', status: 'ACTIVE', imageUrl: 'https://omd-com-files.ams3.digitaloceanspaces.com/wp-content/uploads/2015/12/Herb-crusted-rack-of-lamb.jpg' },
      { name: 'Pan-roasted Sea Bass', description: 'Known for its buttery texture, paired with a light saffron or lemongrass-infused dashi broth, wilted baby bok choy, and ginger oil', price: 10.50, category: 'MAIN', status: 'ACTIVE', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5lRSYr1OblDLv9fOPkbA0c4lls2LMv42nrm8zS2sPwtgdEDhE7zleeQQx&s=10' },
      { name: 'Butter-Poached Lobster Tail', description: 'Slow-cooked in clarified butter until tender, served over a rich lobster risotto or alongside white asparagus and a citrus-herb emulsion', price: 11.00, category: 'MAIN', status: 'ACTIVE', imageUrl: 'https://seasonedandsalted.com/wp-content/uploads/2023/12/Butter-Poached-Lobster-20-683x1024.jpg' },
      { name: 'Grand Marnier Souffle', description: 'A dramatic, perfectly risen souffle flavored with orange liqueur, punctured at the table to pour in vanilla bean Creme Anglaise', price: 5.50, category: 'DESSERT', status: 'ACTIVE', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI9MCDcrEd9Vw91uqX_rhZYPSOGlz3cprKb9DPUx1JmiPVYlI0OP5COYc&s=10' },
      { name: 'Mille-Feuille', description: 'Paper-thin layers of caramelized puff pastry stacked precisely with rich pastry cream, fresh berries, and a dusting of powdered sugar', price: 5.00, category: 'DESSERT', status: 'ACTIVE', imageUrl: 'https://images.squarespace-cdn.com/content/v1/5dabc68430eb5203e266f05f/1607458859513-CU4M03R7WE8MQQFT35VV/mascarpone-namelaka-mille-feuille-2.jpg' },
      { name: 'Sparkling Water', description: 'Refreshing sparkling mineral water', price: 4.50, category: 'BEVERAGE', status: 'ACTIVE', imageUrl: 'https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mh1f622ued5695' },
      { name: 'Smoked Rosemary & Blood Orange Spritz', description: 'Freshly squeezed blood orange juice, rosemary-infused simple syrup, sparkling artisanal water, and a torched rosemary sprig', price: 2.50, category: 'BEVERAGE', status: 'ACTIVE', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg_lsBjno8x0VOU6pyLM70EwKQNejJK-eY0SZDau0EnZzaX0Qw4Hug3Cms&s=10' },
      { name: 'The Vesper Martini', description: 'A sophisticated, timeless classic made with premium gin, vodka, and Lillet Blanc, shaken until ice-cold and garnished with a thin lemon peel', price: 3.50, category: 'BEVERAGE', status: 'ACTIVE', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDvMlrfanWc32YZ7VkPcOgN9l4feBWqG6ZIaD9sTIgkw&s=10' },
      { name: 'Smoked Old Fashioned', description: 'High-end bourbon or rye whiskey stirred with bitters and demerara syrup, trapped under a glass dome filled with cherrywood smoke', price: 2.00, category: 'BEVERAGE', status: 'ACTIVE', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqq-JcUODD3ULplkI-eFYU64L7vAN276ipUR0aVhaZalaWOvv2DCNd5e4&s=10' }
    ];

    const menuItems = await Promise.all(menuItemData.map(ensureMenuItem));

    console.log('Menu items created:', menuItems.length, 'items');

    console.log('Database seeded successfully :>!');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
