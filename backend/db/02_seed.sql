-- Test Users (password: "password123")
-- Password hash generated with bcrypt
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$dct.2de7M9TcUF4Bz23mvuB86ouHZv8haOwaG5o83Uy2PZW/unWsm', 'admin'),
('manager1', '$2b$10$dct.2de7M9TcUF4Bz23mvuB86ouHZv8haOwaG5o83Uy2PZW/unWsm', 'management'),
('floor1', '$2b$10$dct.2de7M9TcUF4Bz23mvuB86ouHZv8haOwaG5o83Uy2PZW/unWsm', 'floor'),
('floor2', '$2b$10$dct.2de7M9TcUF4Bz23mvuB86ouHZv8haOwaG5o83Uy2PZW/unWsm', 'floor'),
('kitchen1', '$2b$10$dct.2de7M9TcUF4Bz23mvuB86ouHZv8haOwaG5o83Uy2PZW/unWsm', 'kitchen'),
('kitchen2', '$2b$10$dct.2de7M9TcUF4Bz23mvuB86ouHZv8haOwaG5o83Uy2PZW/unWsm', 'kitchen');

-- Tables
INSERT INTO tables (label, capacity, status) VALUES
('T1', 2, 'available'),
('T2', 2, 'available'),
('T3', 4, 'available'),
('T4', 4, 'available'),
('T5', 6, 'available'),
('T6', 6, 'available'),
('T7', 8, 'available'),
('T8', 8, 'available');

-- Menu Items
INSERT INTO menu_items (name, description, price, category, status) VALUES
('Foie Gras au Torchon', 'Smooth duck liver terrine served with a seasonal fruit compote and toasted brioche', 8.50, 'starter', 'active'),
('Wagyu Beef Tartare', 'Hand-cut premium Wagyu mixed with capers, shallots, cornichons, and a cured egg yolk', 7.00, 'starter', 'active'),
('Pan-seared Scallops', 'Pean-seared scallops served with a velvety cauliflower puree, a drizzle of brown butter sage sauce, and crispy pancetta', 9.50, 'starter', 'active'),
('A5 Japaneses Wagyu Striploin', 'Wagyu striploin served alongside a rich demi-glace, truffled potato mousseline, and charred seasonal wild mushrooms', 12.00, 'main', 'active'),
('Herb-crusted Rack of Lamb', 'Roasted to a perfect medium-rate, crusted with Dijon mustard and fresh herbs, served with a red wine reduction and roasted root vegetables', 11.50, 'main', 'active'),
('Pan-roasted Sea Bass', 'Known for its buttery texture, paired with a light saffron or lemongrass-infused dashi broth, wilted baby bok choy, and ginger oil', 10.50, 'main', 'active'),
('Butter-Poached Lobster Tail', 'Slow-cooked in clarified butter until tender, served over a rich lobster risotto or alongside white asparagus and a citrus-herb emulsion', 11.00, 'main', 'active'),
('Grand Marnier Souffle', 'A dramatic, perfectly risen souffle flavored with orange liqueur, punctured at the table to pour in vanilla bean Creme Anglaise', 5.50, 'dessert', 'active'),
('Mille-Feuille', 'Paper-thin layers of caramelized puff pastry stacked precisely with rich pastry cream, fresh berries, and a dusting of powdered sugar', 5.00, 'dessert', 'active'),
('Sparkling Water', 'It is water, but sparkling!', 4.50, 'beverage', 'active'),
('Smoked Rosemary & Blood Orange SpritzSmoked Rosemary & Blood Orange Spritz', 'Freshly squeezed blood orange juice, rosemary-infused simple syrup, sparkling artisanal water, and a torched rosemary sprig for aroma', 2.50, 'beverage', 'active'),
('The Vesper Martini', 'A sophisticated, timeless classic made with premium gin, vodka, and Lillet Blanc, shaken until ice-cold and garnished with a thin lemon peel', 3.50, 'beverage', 'active'),
('Smoked Old Fashioned', 'High-end bourbon or rye whiskey stirred with bitters and demerara syrup, trapped under a glass dome filled with cherrywood smoke for a theatrical table-side presentation', 2.00, 'beverage', 'active');
