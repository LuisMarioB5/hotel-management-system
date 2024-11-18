import { validateJwt } from "../authUtils.js";
import { setSidebarGerente } from "./maintenance.auth.js";

async function checkAuthorizationReportsPage() {
    const user = validateJwt();
    
    if(user.role === 'GERENTE') {
        /* Menu Vertical */
        await setSidebarGerente();
    }
}

if(document.URL.endsWith('R_recepcion.html')) {
    checkAuthorizationReportsPage();
}
