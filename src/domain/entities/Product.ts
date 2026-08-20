export class Product {
  private constructor(
    public readonly id: string,
    public readonly productCode: string,
    public name: string,
    public retailPrice: number,
    public costPrice: number,
    public isActive: boolean
  ) {}

  public static create(
    id: string,
    productCode: string,
    name: string,
    retailPrice: number,
    costPrice: number
  ): Product {
    return new Product(id, productCode, name, retailPrice, costPrice, true);
  }
}
