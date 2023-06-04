import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpHeaderResponse,
    HttpInterceptor,
    HttpProgressEvent,
    HttpRequest,
    HttpResponse,
    HttpSentEvent,
    HttpStatusCode,
    HttpUserEvent,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { AuthService } from './auth.service';

@Injectable()
export class RequestInterceptorService implements HttpInterceptor {
    isRefreshingToken = false;
    tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

    constructor(private injector: Injector, private loggerService: LoggerService) {}

    addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
        return req.clone({ setHeaders: { Authorization: 'Bearer ' + token } });
    }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler,
    ): Observable<
        | HttpEvent<any>
        | HttpSentEvent
        | HttpHeaderResponse
        | HttpProgressEvent
        | HttpResponse<any>
        | HttpUserEvent<any>
    > {
        if (
            req.url.includes('/oauth2/token') ||
            req.url.includes('aws-account-configure.template')
        ) {
            return next.handle(req);
        }
        const authService = this.injector.get(AuthService);
        if (this.isTokenRefreshSkippedForUrl(req.url)) {
            this.loggerService.log('info', 'Not adding the access token for this api - ' + req.url);
            return next.handle(req);
        } else if (req.url.includes('user/logout-session')) {
            this.loggerService.log('info', 'Do not retry when logging user out - ' + req.url);
            return next.handle(this.addToken(req, authService.getAuthToken()));
        }

        return next.handle(this.addToken(req, authService.getAuthToken())).pipe(
            catchError((error) => {
                // We don't want to refresh token for some requests like login or refresh token itself
                // So we verify url and we throw an error if it's the case
                if (this.isTokenRefreshSkippedForUrl(req.url)) {
                    // We do another check to see if refresh token failed
                    // In this case we want to logout user and to redirect it to login page
                    if (this.isUserRefreshOrAuthUrl(req.url)) {
                        authService.doLogout();
                    }

                    return observableThrowError(error);
                }

                if (error instanceof HttpErrorResponse) {
                    if (error.status === HttpStatusCode.BadRequest) {
                        return this.handleBadRequest(error);
                    } else if (error.status === HttpStatusCode.Unauthorized) {
                        return this.handleUnauthorized(req, next);
                    }
                }

                return observableThrowError(error);
            }),
        );
    }

    handleBadRequest(error: HttpErrorResponse) {
        if (error.error?.error === 'invalid_grant') {
            // If we get a 400 and the error message is 'invalid_grant', the token is no longer valid so logout.
            return this.logoutUser();
        }

        return observableThrowError(error);
    }

    handleUnauthorized(req: HttpRequest<any>, next: HttpHandler) {
        const authService = this.injector.get(AuthService);

        if (this.isRefreshingToken) {
            return this.tokenSubject.pipe(
                filter((token) => !!token),
                take(1),
                switchMap((token: string) => next.handle(this.addToken(req, token))),
            );
        }

        this.isRefreshingToken = true;

        // Reset here so that the following requests wait until the token
        // comes back from the refreshToken call.
        this.tokenSubject.next(null);

        return authService.refreshToken().pipe(
            switchMap((newToken: string) => {
                if (newToken) {
                    this.tokenSubject.next(newToken);
                    return next.handle(this.addToken(req, newToken));
                }

                // If we don't get a new token, we are in trouble so logout.
                return this.logoutUser();
            }),
            catchError(() => {
                // If there is an exception calling 'refreshToken', bad news so logout.
                return this.logoutUser();
            }),
            finalize(() => {
                this.isRefreshingToken = false;
            }),
        );
    }

    logoutUser() {
        const authService = this.injector.get(AuthService);
        // Route to the login page (implementation up to you)
        authService.doLogout();
        return observableThrowError('');
    }

    private isTokenRefreshSkippedForUrl(url: string) {
        return url.includes('user/login') || this.isUserRefreshOrAuthUrl(url);
    }

    private isUserRefreshOrAuthUrl(url: string) {
        return url.includes('user/refresh') || url.includes('user/authorize');
    }
}
