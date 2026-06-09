const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

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

    const menuItems = await Promise.all([
      // Starters
      prisma.menuItem.upsert({
        where: { name: 'Foie Gras au Torchon' },
        update: {},
        create: {
          name: 'Foie Gras au Torchon',
          description: 'Smooth duck liver terrine served with a seasonal fruit compote and toasted brioche',
          price: 8.50,
          category: 'STARTER',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Wagyu Beef Tartare' },
        update: {},
        create: {
          name: 'Wagyu Beef Tartare',
          description: 'Hand-cut premium Wagyu mixed with capers, shallots, cornichons, and a cured egg yolk',
          price: 7.00,
          category: 'STARTER',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Pan-seared Scallops' },
        update: {},
        create: {
          name: 'Pan-seared Scallops',
          description: 'Pan-seared scallops served with a velvety cauliflower puree, a drizzle of brown butter sage sauce, and crispy pancetta',
          price: 9.50,
          category: 'STARTER',
          status: 'ACTIVE'
        }
      }),

      // Mains
      prisma.menuItem.upsert({
        where: { name: 'A5 Japanese Wagyu Striploin' },
        update: {},
        create: {
          name: 'A5 Japanese Wagyu Striploin',
          description: 'Wagyu striploin served alongside a rich demi-glace, truffled potato mousseline, and charred seasonal wild mushrooms',
          price: 12.00,
          category: 'MAIN',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Herb-crusted Rack of Lamb' },
        update: {},
        create: {
          name: 'Herb-crusted Rack of Lamb',
          description: 'Roasted to a perfect medium-rare, crusted with Dijon mustard and fresh herbs, served with a red wine reduction and roasted root vegetables',
          price: 11.50,
          category: 'MAIN',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Pan-roasted Sea Bass' },
        update: {},
        create: {
          name: 'Pan-roasted Sea Bass',
          description: 'Known for its buttery texture, paired with a light saffron or lemongrass-infused dashi broth, wilted baby bok choy, and ginger oil',
          price: 10.50,
          category: 'MAIN',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Butter-Poached Lobster Tail' },
        update: {},
        create: {
          name: 'Butter-Poached Lobster Tail',
          description: 'Slow-cooked in clarified butter until tender, served over a rich lobster risotto or alongside white asparagus and a citrus-herb emulsion',
          price: 11.00,
          category: 'MAIN',
          status: 'ACTIVE'
        }
      }),

      // Desserts
      prisma.menuItem.upsert({
        where: { name: 'Grand Marnier Souffle' },
        update: {},
        create: {
          name: 'Grand Marnier Souffle',
          description: 'A dramatic, perfectly risen souffle flavored with orange liqueur, punctured at the table to pour in vanilla bean Creme Anglaise',
          price: 5.50,
          category: 'DESSERT',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Mille-Feuille' },
        update: {},
        create: {
          name: 'Mille-Feuille',
          description: 'Paper-thin layers of caramelized puff pastry stacked precisely with rich pastry cream, fresh berries, and a dusting of powdered sugar',
          price: 5.00,
          category: 'DESSERT',
          status: 'ACTIVE'
        }
      }),

      // Beverages
      prisma.menuItem.upsert({
        where: { name: 'Sparkling Water' },
        update: {},
        create: {
          name: 'Sparkling Water',
          description: 'Refreshing sparkling mineral water',
          price: 4.50,
          category: 'BEVERAGE',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Smoked Rosemary & Blood Orange Spritz' },
        update: {},
        create: {
          name: 'Smoked Rosemary & Blood Orange Spritz',
          description: 'Freshly squeezed blood orange juice, rosemary-infused simple syrup, sparkling artisanal water, and a torched rosemary sprig',
          price: 2.50,
          category: 'BEVERAGE',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'The Vesper Martini' },
        update: {},
        create: {
          name: 'The Vesper Martini',
          description: 'A sophisticated, timeless classic made with premium gin, vodka, and Lillet Blanc, shaken until ice-cold and garnished with a thin lemon peel',
          price: 3.50,
          category: 'BEVERAGE',
          status: 'ACTIVE'
        }
      }),
      prisma.menuItem.upsert({
        where: { name: 'Smoked Old Fashioned' },
        update: {},
        create: {
          name: 'Smoked Old Fashioned',
          description: 'High-end bourbon or rye whiskey stirred with bitters and demerara syrup, trapped under a glass dome filled with cherrywood smoke',
          price: 2.00,
          category: 'BEVERAGE',
          status: 'ACTIVE'
        }
      })
    ]);

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
