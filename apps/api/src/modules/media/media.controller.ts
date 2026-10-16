import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Role, type AuthUser } from '@nutrigon/contracts';
import { MediaService } from './media.service.js';
import { GetUploadUrlDto } from './dto/get-upload-url.dto.js';
import { AuthRoles } from '../../common/decorators/auth-roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @AuthRoles(Role.ADMIN_GENERAL, Role.BRANCH_ADMIN)
  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  async generateUploadUrl(
    @Body() dto: GetUploadUrlDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (user?.role === Role.BRANCH_ADMIN && dto.folder !== 'combos') {
      throw new ForbiddenException(
        'Branch administrators can only upload images to the combos folder',
      );
    }

    return this.mediaService.generateUploadUrl(dto);
  }
}
