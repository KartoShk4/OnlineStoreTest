export type CartItem = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    url: string;
  };
  quantity: number;
};

export type CartType = {
  items: CartItem[];
};
