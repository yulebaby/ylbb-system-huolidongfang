import { NzMessageService } from 'ng-zorro-antd';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

/* 序列化请求参数 */
export const serialize = (data: object): string => {
  let val = ''; for (let v in data) { if (data[v] !== '' && data[v] !== null && data[v] !== undefined) { val += `${v}=${data[v]}&`; } }
  return val.slice(0, val.length - 1);
}

@Injectable()
export class NoopInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /* ----------- 如不是完整URL路径则拼接开发环境配置的主域名 ----------- */
    if (req.url.substr(0, 4) !== 'http') {
      if (req.url.indexOf('yeqs') == -1 && req.url.indexOf('qinshuiList') == -1 ) {
      req = req.clone({
        url: environment.domain + req.url,
        withCredentials: true,
      });
     }else{
      req = req.clone({
        url: environment.domainYeqs + req.url,
        withCredentials: true,
      });
     }
    }
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          if (event.status == 200 || event.status == 304) {
            if (event.body && event.body.code == 3000) {
              window.localStorage.removeItem('userInfo');
              this.router.navigateByUrl('/login');
            }
          } else {
            this.message.error('网络错误，请刷新重试');
          }
        }
      })
    )
  }

  constructor(
    private router: Router,
    private message: NzMessageService
  ) { }

}
export interface YlbbResponse {
  code  : number;
  info  : string;
  result: any
}