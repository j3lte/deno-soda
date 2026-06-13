/**
 * An `$order` clause entry. Build it with {@link Order.by}, then pick a
 * direction via `.asc` or `.desc`.
 *
 * @example
 * ```ts
 * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
 * query.orderBy(Order.by("created_date").desc, Order.by("borough").asc);
 * ```
 */
export class Order {
  /** The rendered order expression, e.g. `created_date DESC`. */
  value = "";
  /**
   * Start an order entry for a field.
   *
   * @param field The field to order by
   * @returns An object with `asc` / `desc` getters that set the direction
   *
   * @example
   * ```ts
   * Order.by("created_date").desc; // created_date DESC
   * Order.by("borough").asc; // borough ASC
   * ```
   */
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
