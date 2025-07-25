import { Injectable, NotFoundException } from "@nestjs/common"
import { CategoryService } from "src/category/category.service"
import { PrismaService } from "src/prisma.service"
import { returnProductObject } from "./return-product.object"
import { ProductDto } from "./dto/product.dto"
import { generateSlug } from "src/utils/generarte-slug"

@Injectable()
export class ProductService {
	constructor(
		private prisma: PrismaService,
		private categoryService: CategoryService
	) {}

	async getAll(searchTerm?: string) {
		if (searchTerm) return this.search(searchTerm)

		return this.prisma.product.findMany({
			select: returnProductObject,
			orderBy: {
				createdAt: "desc"
			}
		})
	}

	async search(searchTerm: string) {
		return this.prisma.product.findMany({
			where: {
				OR: [
					{
						name: {
							contains: searchTerm,
							mode: "insensitive"
						},
						description: {
							contains: searchTerm,
							mode: "default"
						}
					}
				]
			},
			select: returnProductObject
		})
	}

	async getBySlug(slug: string) {
		const product = await this.prisma.product.findUnique({
			where: { slug },
			select: returnProductObject
		})

		if (!product) throw new NotFoundException("Product not found!")

		return product
	}

	async getByCategory(categorySlug: string) {
		const products = await this.prisma.product.findMany({
			where: { category: { slug: categorySlug } },
			select: returnProductObject
		})

		if (!products) throw new NotFoundException("Products not found!")

		return products
	}

	async create() {
		return this.prisma.product.create({
			data: { name: "", slug: "", image: "", description: "", price: 0 }
		})
	}

	async update(id: string, dto: ProductDto) {
		const { name, categoryId, description, image, price } = dto

		await this.categoryService.getById(categoryId)

		return this.prisma.product.update({
			where: { id },
			data: {
				name,
				description,
				price,
				image,
				slug: generateSlug(name),
				category: {
					connect: { id: categoryId }
				}
			}
		})
	}

	async delete(id: string) {
		return this.prisma.product.delete({ where: { id } })
	}
}
