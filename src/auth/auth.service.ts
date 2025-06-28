/* eslint-disable @typescript-eslint/require-await */
import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from "@nestjs/common"
import { AuthDto } from "./dto/auth.dto"
import { PrismaService } from "src/prisma.service"
import { hash, verify } from "argon2"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { User } from "@prisma/client"
import { faker } from "@faker-js/faker"

@Injectable()
export class AuthService {
	private readonly JWT_ACCESS_TOKEN_TTL: string
	private readonly JWT_REFRESH_TOKEN_TTL: string

	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private configService: ConfigService
	) {
		this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>(
			"JWT_ACCESS_TOKEN_TTL"
		)
		this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>(
			"JWT_REFRESH_TOKEN_TTL"
		)
	}

	async register(dto: AuthDto) {
		const existUser = await this.prisma.user.findUnique({
			where: { email: dto.email }
		})

		if (existUser) throw new BadRequestException("User already exist")

		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				name: faker.person.firstName(),
				avatarPath: faker.image.avatar(),
				phone: faker.phone.number(),
				password: await hash(dto.password)
			}
		})

		const tokens = await this.issueTokens(user.id)

		return { user: this.returnUserData(user), ...tokens }
	}

	async login(dto: AuthDto) {
		const user = await this.validateUser(dto)
		const tokens = await this.issueTokens(user?.id)

		return { user: this.returnUserData(user), ...tokens }
	}

	async getNewTokens(refreshToken: string) {
		const result: User = await this.jwt.verifyAsync(refreshToken)
		if (!result) throw new UnauthorizedException("Invalid refresh token")

		const user = await this.prisma.user.findUnique({
			where: {
				id: result.id
			}
		})

		const tokens = await this.issueTokens(user!.id)

		return { user: this.returnUserData(user!), ...tokens }
	}

	private async issueTokens(id: string) {
		const data = { id }

		const accessToken = this.jwt.sign(data, {
			expiresIn: this.JWT_ACCESS_TOKEN_TTL
		})

		const refreshToken = this.jwt.sign(data, {
			expiresIn: this.JWT_REFRESH_TOKEN_TTL
		})

		return { accessToken, refreshToken }
	}

	private returnUserData(user: User) {
		const { email, id } = user

		return {
			id,
			email
		}
	}

	private async validateUser(dto: AuthDto) {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email }
		})

		if (!user) throw new NotFoundException("User is not found!")

		const isValidPassword = await verify(user.password, dto.password)

		if (!isValidPassword) throw new UnauthorizedException("Invalid password!")

		return user
	}
}
