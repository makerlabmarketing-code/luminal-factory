// config/categories.ts

export interface CategoryNode {
    id: string;
    name: string;
    subCategories?: string[]; // Danh sách các danh mục con tương ứng
  }
  
  export const PRODUCT_CATEGORIES: CategoryNode[] = [
    {
      id: 'artisan-keycap',
      name: '📁 Keycap Artisan',
      subCategories: [
        '↳ Bộ Meowhe Series 🐱',
        '↳ Bộ Lollipop Candy 🍭',
        '↳ Bộ Cyberpunk Neon 🌆',
        '↳ Bộ Dragon Ancient 🐉'
      ]
    },
    {
      id: 'resin-accessories',
      name: '📁 Phụ Kiện Resin Cao Cấp',
      subCategories: [
        '↳ Giá đỡ tai nghe 🎧',
        '↳ Đèn ngủ Epoxy 🌌',
        '↳ Khay cắm bút Artisan ✒️'
      ]
    },
    {
      id: 'tools-vattu',
      name: '📁 Vật Tư & Phôi In 3D',
      subCategories: [
        '↳ Phôi Resin Elegoo Trắng',
        '↳ Cồn vệ sinh siêu âm 90°',
        '↳ Màu lót Concept Acrylic'
      ]
    }
  ];