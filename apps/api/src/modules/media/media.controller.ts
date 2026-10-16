import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@nutrigon/contracts';
import { MediaService } from './media.service.js';
import { GetUploadUrlDto } from './dto/get-upload-url.dto.js';
import { AuthRoles } from '../../common/decorators/auth-roles.decorator.js';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @AuthRoles(Role.ADMIN_GENERAL)
  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  async generateUploadUrl(@Body() dto: GetUploadUrlDto) {
    return this.mediaService.generateUploadUrl(dto);
  }
}
