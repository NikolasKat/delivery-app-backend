/* eslint-disable @typescript-eslint/require-await */
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UsePipes,
	ValidationPipe
} from "@nestjs/common"
import { AuthService } from "./auth.service"
import { AuthDto } from "./dto/auth.dto"
import { RefreshTokenDto } from "./dto/refresh-token.dto"
import { Auth } from "./decorators/auth.decorator"

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@UsePipes(new ValidationPipe())
	@HttpCode(HttpStatus.OK)
	@Post("login")
	async login(@Body() dto: AuthDto) {
		return this.authService.login(dto)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(HttpStatus.OK)
	@Auth()
	@Post("login/access-token")
	async getNewTokens(@Body() dto: RefreshTokenDto) {
		return this.authService.getNewTokens(dto.refreshToken)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(HttpStatus.OK)
	@Post("register")
	async register(@Body() dto: AuthDto) {
		return this.authService.register(dto)
	}
}
