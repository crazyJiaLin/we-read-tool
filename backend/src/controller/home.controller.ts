import { Controller, Get, Logger } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
@Controller('/')
export class HomeController {
  @Logger()
  logger: ILogger;

  @Get('/')
  async home(): Promise<string> {
    this.logger.info('logger---info: Hello we-read!');
    return 'Hello we-read!';
  }
}
