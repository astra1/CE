import {
    Inject,
    InjectionToken,
    ModuleWithProviders,
    NgModule,
    Optional,
    SkipSelf,
} from '@angular/core';

const CLARITY_PROJECTID_TOKEN = new InjectionToken<string>('clarity.projectId');

function clarityScript(projectId: string) {
    return `
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${projectId}");`;
}

@NgModule()
export class ClarityModule {
    constructor(
        @Optional() @SkipSelf() parentModule: ClarityModule,
        @Inject(CLARITY_PROJECTID_TOKEN) projectId: string,
    ) {
        if (parentModule) {
            throw new Error('ClarityModule is already loaded. Import it in the AppModule only');
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = clarityScript(projectId);
        document.head.appendChild(script);
    }

    static forRoot(projectId: string): ModuleWithProviders<ClarityModule> {
        return {
            ngModule: ClarityModule,
            providers: [
                {
                    provide: CLARITY_PROJECTID_TOKEN,
                    useValue: projectId,
                },
            ],
        };
    }
}
