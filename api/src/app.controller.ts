import { Controller, Get, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { JwtGuard } from './auth/jwt/guards';



@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Get()
  getHello(@Req() request: Request,
  @Res({ passthrough: true }) response: Response
  ): any {
    return ' BONJOURNO!'
    // console.log('in hello');
    
    // console.log(request.cookies);
        
    // // console.log(response);
    // return this.appService.getHello();
  }

  @UseGuards(JwtGuard)
  @Get()
  privateEndpoint(@Req() req): any {
    console.log(req.cookies);
    return this.appService.getHello();
  }


  @Get('/pub')
  publicEndpoint(@Req() req): any {
    console.log(req.cookies);
    return this.appService.getHello();
  }

  @Get('/email')
  sendMail(): void {
    return this.appService.sendMail();
  }
}
