export class Order {
  value = "";
  static by(field: string): {
    desc: Order;
    asc: Order;
  } {
    const order = new Order();
    return {
      get desc() {
        order.value = `${field} DESC`;
        return order;
      },
      get asc() {
        order.value = `${field} ASC`;
        return order;
      },
    };
  }
}
